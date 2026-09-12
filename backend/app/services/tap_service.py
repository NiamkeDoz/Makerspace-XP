from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.badges import ATTENDANCE_BADGES, STREAK_BADGES, newly_crossed
from app.models import Member, MemberBadge, Tap, Visit
from app.rules import points_for_streak
from app.schemas import TapIn, TapResult
from app.xp_rules import level_for_xp


def _member_snapshot(member: Member, **overrides) -> dict:
    return {
        "member_id": member.id,
        "name": member.name,
        "points_balance": member.points_balance,
        "current_streak": member.current_streak,
        "longest_streak": member.longest_streak,
        "level": member.level,
        **overrides,
    }


def _award_badges(
    db: Session,
    member: Member,
    badge_type: str,
    thresholds: list[tuple[int, str]],
    before: int,
    after: int,
    earned_at: datetime,
) -> list[MemberBadge]:
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
    attendance_awarded = _award_badges(db, member, "attendance", ATTENDANCE_BADGES, visits_before, visits_after, tap_time)

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
    streak_awarded = _award_badges(db, member, "streak", STREAK_BADGES, streak_before, member.longest_streak, tap_time)

    points = points_for_streak(member.current_streak)
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
        badges_awarded=attendance_awarded + streak_awarded,
    )
