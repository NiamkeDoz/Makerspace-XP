from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Member, Tap
from app.rules import points_for_streak
from app.schemas import TapIn, TapResult
from app.xp_rules import level_for_xp


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

    if member.last_tap_date == tap_day:
        db.commit()
        return TapResult(
            status="duplicate",
            member_id=member.id,
            name=member.name,
            points_awarded=0,
            points_balance=member.points_balance,
            current_streak=member.current_streak,
            longest_streak=member.longest_streak,
            xp_awarded=0,
            level=member.level,
            leveled_up=False,
        )

    if member.last_tap_date == tap_day - timedelta(days=1):
        member.current_streak += 1
    else:
        member.current_streak = 1

    member.longest_streak = max(member.longest_streak, member.current_streak)
    member.last_tap_date = tap_day

    points = points_for_streak(member.current_streak)
    member.points_balance += points

    # Tap-in earns points and XP at the same rate (per the project's XP earning table).
    xp_earned = points
    member.xp += xp_earned
    member.lifetime_xp += xp_earned
    previous_level = member.level
    member.level = level_for_xp(member.xp)
    leveled_up = member.level > previous_level

    db.add(Tap(member_id=member.id, reader_id=tap_in.reader_id, timestamp=tap_time, points_awarded=points))
    db.commit()
    db.refresh(member)

    return TapResult(
        status="enrolled" if enrolled else "recorded",
        member_id=member.id,
        name=member.name,
        points_awarded=points,
        points_balance=member.points_balance,
        current_streak=member.current_streak,
        longest_streak=member.longest_streak,
        xp_awarded=xp_earned,
        level=member.level,
        leveled_up=leveled_up,
    )
