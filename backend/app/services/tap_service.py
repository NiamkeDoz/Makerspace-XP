from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Member, Tap
from app.rules import points_for_streak
from app.schemas import TapIn, TapResult


def record_tap(db: Session, tap_in: TapIn) -> TapResult:
    member = db.query(Member).filter(Member.tag_id == tap_in.tag_id).one_or_none()
    if member is None:
        return TapResult(status="unknown_tag")

    tap_time = tap_in.timestamp or datetime.utcnow()
    tap_day = tap_time.date()

    if member.last_tap_date == tap_day:
        return TapResult(
            status="duplicate",
            member_id=member.id,
            points_awarded=0,
            points_balance=member.points_balance,
            current_streak=member.current_streak,
            longest_streak=member.longest_streak,
        )

    if member.last_tap_date == tap_day - timedelta(days=1):
        member.current_streak += 1
    else:
        member.current_streak = 1

    member.longest_streak = max(member.longest_streak, member.current_streak)
    member.last_tap_date = tap_day

    points = points_for_streak(member.current_streak)
    member.points_balance += points

    db.add(Tap(member_id=member.id, reader_id=tap_in.reader_id, timestamp=tap_time, points_awarded=points))
    db.commit()
    db.refresh(member)

    return TapResult(
        status="recorded",
        member_id=member.id,
        points_awarded=points,
        points_balance=member.points_balance,
        current_streak=member.current_streak,
        longest_streak=member.longest_streak,
    )
