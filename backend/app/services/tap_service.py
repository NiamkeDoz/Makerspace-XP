from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.badges import category_catalog, newly_crossed
from app.models import Member, MemberBadge, RetiredTag, Tap, Visit
from app.rules import points_for_streak
from app.schemas import TapIn, TapResult
from app.services.settings_service import get_settings
from app.xp_rules import level_for_xp


def _member_snapshot(member: Member, **overrides) -> dict:
    return {
        "member_id": member.id,
        "name": member.name,
        "points_balance": member.points_balance,
        "current_streak": member.current_streak,
        "longest_streak": member.longest_streak,
        "current_weekly_streak": member.current_weekly_streak,
        "longest_weekly_streak": member.longest_weekly_streak,
        "level": member.level,
        **overrides,
    }


def _week_start(d):
    return d - timedelta(days=d.weekday())


def _double_xp_active(settings, at: datetime) -> bool:
    """Whether `at` falls inside the admin-scheduled double-XP window (both ends
    inclusive, both must be set). Stacks with the streak multiplier — see rules.py."""
    if settings.double_xp_start is None or settings.double_xp_end is None:
        return False
    at_aware = at if at.tzinfo is not None else at.replace(tzinfo=timezone.utc)
    return settings.double_xp_start <= at_aware <= settings.double_xp_end


def _award_badges(
    db: Session,
    member: Member,
    badge_type: str,
    before: int,
    after: int,
    earned_at: datetime,
) -> list[MemberBadge]:
    thresholds, _descriptions, _icons = category_catalog(db, badge_type)
    crossed = newly_crossed(thresholds, before, after)
    if not crossed:
        return []

    already_earned = {
        threshold
        for (threshold,) in db.query(MemberBadge.threshold)
        .filter(MemberBadge.member_id == member.id, MemberBadge.badge_type == badge_type)
        .all()
    }

    awarded = []
    for threshold, name in crossed:
        if threshold in already_earned:
            continue
        badge = MemberBadge(
            member_id=member.id,
            badge_type=badge_type,
            threshold=threshold,
            name=name,
            earned_at=earned_at,
        )
        db.add(badge)
        awarded.append(badge)
    return awarded


def record_tap(db: Session, tap_in: TapIn) -> TapResult:
    member = db.query(Member).filter(Member.tag_id == tap_in.tag_id).one_or_none()
    enrolled = False

    if member is None:
        retired = db.query(RetiredTag).filter(RetiredTag.tag_id == tap_in.tag_id).one_or_none()
        if retired is not None:
            retired_member = db.get(Member, retired.member_id)
            return TapResult(status="retired_tag", member_id=retired.member_id, name=retired_member.name if retired_member else None)

        if not tap_in.name:
            return TapResult(status="unknown_tag")

        member = Member(tag_id=tap_in.tag_id, name=tap_in.name)
        db.add(member)
        try:
            db.flush()
        except IntegrityError:
            # Tag was registered by a concurrent request between the lookup and this insert.
            db.rollback()
            member = db.query(Member).filter(Member.tag_id == tap_in.tag_id).one()
        else:
            enrolled = True

    tap_time = tap_in.timestamp or datetime.utcnow()
    tap_day = tap_time.date()

    open_visit = db.query(Visit).filter(Visit.member_id == member.id, Visit.check_out.is_(None)).one_or_none()

    if open_visit is not None:
        # This tap closes the member's open session (check-out). No XP/points either way.
        open_visit.check_out = tap_time
        open_visit.check_out_reader_id = tap_in.reader_id
        db.add(Tap(member_id=member.id, reader_id=tap_in.reader_id, timestamp=tap_time, points_awarded=0, direction="out"))
        db.commit()
        db.refresh(member)
        return TapResult(status="checked_out", **_member_snapshot(member))

    # No open session: this tap is a check-in. Always opens a new visit, regardless of
    # whether points/XP were already earned today.
    visits_before = db.query(Visit).filter(Visit.member_id == member.id).count()
    db.add(Visit(member_id=member.id, check_in=tap_time, check_in_reader_id=tap_in.reader_id))
    visits_after = visits_before + 1
    attendance_awarded = _award_badges(db, member, "attendance", visits_before, visits_after, tap_time)

    if member.last_tap_date == tap_day:
        db.add(Tap(member_id=member.id, reader_id=tap_in.reader_id, timestamp=tap_time, points_awarded=0, direction="in"))
        db.commit()
        db.refresh(member)
        return TapResult(
            status="duplicate",
            **_member_snapshot(member),
            xp_awarded=0,
            leveled_up=False,
            badges_awarded=attendance_awarded,
        )

    if member.last_tap_date == tap_day - timedelta(days=1):
        member.current_streak += 1
    else:
        member.current_streak = 1

    streak_before = member.longest_streak
    member.longest_streak = max(member.longest_streak, member.current_streak)
    member.last_tap_date = tap_day
    streak_awarded = _award_badges(db, member, "streak", streak_before, member.longest_streak, tap_time)

    # Weekly streak: consecutive ISO weeks (Mon-Sun) with at least one check-in. Independent
    # of the daily streak - a member who taps once a week keeps this alive even if the daily
    # streak resets between visits.
    tap_week = _week_start(tap_day)
    if member.last_check_in_week is None:
        member.current_weekly_streak = 1
    elif tap_week == member.last_check_in_week:
        pass  # already checked in this week; no change
    elif tap_week == member.last_check_in_week + timedelta(days=7):
        member.current_weekly_streak += 1
    else:
        member.current_weekly_streak = 1
    weekly_streak_before = member.longest_weekly_streak
    member.longest_weekly_streak = max(member.longest_weekly_streak, member.current_weekly_streak)
    member.last_check_in_week = tap_week
    weekly_streak_awarded = _award_badges(
        db, member, "weekly_streak", weekly_streak_before, member.longest_weekly_streak, tap_time
    )

    settings = get_settings(db)
    points = points_for_streak(member.current_streak, settings.base_points)
    double_xp = _double_xp_active(settings, tap_time)
    if double_xp:
        points *= 2
    member.points_balance += points

    # Tap-in earns points and XP at the same rate (per the project's XP earning table).
    xp_earned = points
    member.xp += xp_earned
    member.lifetime_xp += xp_earned
    previous_level = member.level
    member.level = level_for_xp(member.xp)
    leveled_up = member.level > previous_level

    db.add(Tap(member_id=member.id, reader_id=tap_in.reader_id, timestamp=tap_time, points_awarded=points, direction="in"))
    db.commit()
    db.refresh(member)

    return TapResult(
        status="enrolled" if enrolled else "recorded",
        **_member_snapshot(member),
        points_awarded=points,
        xp_awarded=xp_earned,
        leveled_up=leveled_up,
        badges_awarded=attendance_awarded + streak_awarded + weekly_streak_awarded,
        double_xp_applied=double_xp,
    )
