from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.badges import ATTENDANCE_BADGES, STREAK_BADGES
from app.badges import next_threshold as next_badge
from app.database import get_db
from app.models import Member, MemberBadge, Visit
from app.schemas import CatalogBadge, MemberOut
from app.xp_rules import xp_for_level, xp_into_level, xp_to_next_level

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/{member_id}", response_model=MemberOut, summary="Get a member's full profile")
def get_member(member_id: int, db: Session = Depends(get_db)):
    """
    Full profile for one member — what the Member Dashboard page renders.

    `xp` is cumulative since the last prestige (drives `level`); `lifetime_xp` survives
    prestige resets. `xp_into_level`/`xp_for_level` are the numerator/denominator for a level
    progress bar (`xp_for_level` is `null` at max level). `total_visits` counts closed + open
    check-in/check-out **visits**, not raw tap rows.

    Earned badges are persisted at the moment they're first crossed (`earned_at` timestamp,
    see `app/models/member_badge.py`) rather than recomputed — the "next" badge in each
    category is still derived live from current stats, since it isn't earned yet.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    total_visits = db.query(func.count(Visit.id)).filter(Visit.member_id == member.id).scalar()

    member_badges = (
        db.query(MemberBadge).filter(MemberBadge.member_id == member.id).order_by(MemberBadge.earned_at.desc()).all()
    )
    attendance_badges = [b for b in member_badges if b.badge_type == "attendance"]
    streak_badges = [b for b in member_badges if b.badge_type == "streak"]

    return MemberOut(
        id=member.id,
        name=member.name,
        points_balance=member.points_balance,
        current_streak=member.current_streak,
        longest_streak=member.longest_streak,
        level=member.level,
        xp=member.xp,
        xp_to_next=xp_to_next_level(member.xp, member.level),
        xp_into_level=xp_into_level(member.xp, member.level),
        xp_for_level=xp_for_level(member.level),
        lifetime_xp=member.lifetime_xp,
        prestige_count=member.prestige_count,
        last_tap_date=member.last_tap_date,
        total_visits=total_visits,
        member_since=member.created_at,
        attendance_badges=attendance_badges,
        streak_badges=streak_badges,
        next_attendance_badge=next_badge(ATTENDANCE_BADGES, total_visits),
        next_streak_badge=next_badge(STREAK_BADGES, member.longest_streak),
    )


@router.get(
    "/{member_id}/badges",
    response_model=list[CatalogBadge],
    summary="Full badge catalog for a member (earned and not-yet-earned)",
)
def get_member_badges(member_id: int, db: Session = Depends(get_db)):
    """
    Every badge that exists (attendance + streak), each flagged earned or not for this
    member — unlike GET /members/{id}, which only returns earned badges plus the single
    next one per category. Powers the "show all badges" gallery page.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    total_visits = db.query(func.count(Visit.id)).filter(Visit.member_id == member.id).scalar()

    earned_at_by_threshold = {
        (b.badge_type, b.threshold): b.earned_at
        for b in db.query(MemberBadge).filter(MemberBadge.member_id == member.id).all()
    }

    def build(category: str, thresholds: list[tuple[int, str]], current_value: int) -> list[CatalogBadge]:
        entries = []
        for threshold, name in thresholds:
            earned_at = earned_at_by_threshold.get((category, threshold))
            entries.append(
                CatalogBadge(
                    category=category,
                    threshold=threshold,
                    name=name,
                    earned=earned_at is not None,
                    earned_at=earned_at,
                    remaining=None if earned_at is not None else max(threshold - current_value, 0),
                )
            )
        return entries

    return build("attendance", ATTENDANCE_BADGES, total_visits) + build(
        "streak", STREAK_BADGES, member.longest_streak
    )
