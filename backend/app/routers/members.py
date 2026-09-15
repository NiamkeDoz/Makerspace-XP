from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.badges import STATION_BADGES, category_catalog
from app.badges import next_threshold as next_badge
from app.database import get_db
from app.models import Member, MemberBadge, Visit
from app.schemas import CatalogBadge, MemberIdOut, MemberOut
from app.xp_rules import xp_for_level, xp_into_level, xp_to_next_level

router = APIRouter(prefix="/members", tags=["members"])


@router.get(
    "/by-tag/{tag_id}",
    response_model=MemberIdOut,
    summary="Resolve a tag ID to a member ID",
)
def get_member_id_by_tag(tag_id: str, db: Session = Depends(get_db)):
    """
    Lets the Member Dashboard's lookup form accept a tag ID (what a member actually has
    on hand) instead of the numeric member ID (an internal detail that keeps climbing as
    test data accumulates). The frontend resolves the tag here, then navigates to
    `/dashboard/{id}` as usual.
    """
    member = db.query(Member).filter(Member.tag_id == tag_id).one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="No member with that tag ID")
    return MemberIdOut(id=member.id)


@router.get("/{member_id}", response_model=MemberOut, summary="Get a member's full profile")
def get_member(member_id: int, db: Session = Depends(get_db)):
    """
    Full profile for one member — what the Member Dashboard page renders.

    `xp` is cumulative since the last prestige (drives `level`); `lifetime_xp` survives
    prestige resets. `xp_into_level`/`xp_for_level` are the numerator/denominator for a level
    progress bar (`xp_for_level` is `null` at max level). `total_visits` counts closed + open
    check-in/check-out **visits**, not raw tap rows. `current_weekly_streak`/
    `longest_weekly_streak` track consecutive ISO weeks with at least one check-in —
    independent of the daily streak, which resets if a single day is missed.

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
    weekly_streak_badges = [b for b in member_badges if b.badge_type == "weekly_streak"]

    attendance_catalog, attendance_descriptions, attendance_icons = category_catalog(db, "attendance")
    streak_catalog, streak_descriptions, streak_icons = category_catalog(db, "streak")
    weekly_streak_catalog, weekly_streak_descriptions, weekly_streak_icons = category_catalog(db, "weekly_streak")

    def next_with_description(catalog, descriptions, icons, value):
        nb = next_badge(catalog, value)
        if nb is not None:
            nb["description"] = descriptions.get(nb["threshold"])
            nb["icon"] = icons.get(nb["threshold"])
        return nb

    return MemberOut(
        id=member.id,
        name=member.name,
        points_balance=member.points_balance,
        current_streak=member.current_streak,
        longest_streak=member.longest_streak,
        current_weekly_streak=member.current_weekly_streak,
        longest_weekly_streak=member.longest_weekly_streak,
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
        weekly_streak_badges=weekly_streak_badges,
        next_attendance_badge=next_with_description(
            attendance_catalog, attendance_descriptions, attendance_icons, total_visits
        ),
        next_streak_badge=next_with_description(
            streak_catalog, streak_descriptions, streak_icons, member.longest_streak
        ),
        next_weekly_streak_badge=next_with_description(
            weekly_streak_catalog, weekly_streak_descriptions, weekly_streak_icons, member.longest_weekly_streak
        ),
    )


@router.get(
    "/{member_id}/badges",
    response_model=list[CatalogBadge],
    summary="Full badge catalog for a member (earned and not-yet-earned)",
)
def get_member_badges(member_id: int, db: Session = Depends(get_db)):
    """
    Every badge that exists (attendance + streak + weekly_streak + per-station), each
    flagged earned or not for this member — unlike GET /members/{id}, which only returns
    earned badges plus the single next one per category. Powers the "show all badges"
    gallery page.

    Station badges (laser cutter, 3D printing, etc.) always show as not-yet-earned —
    nothing records which station a tap was for yet, see Issues/014.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    total_visits = db.query(func.count(Visit.id)).filter(Visit.member_id == member.id).scalar()

    earned_at_by_threshold = {
        (b.badge_type, b.threshold): b.earned_at
        for b in db.query(MemberBadge).filter(MemberBadge.member_id == member.id).all()
    }

    def build(category: str, current_value: int) -> list[CatalogBadge]:
        thresholds, descriptions, icons = category_catalog(db, category)
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
                    description=descriptions.get(threshold),
                    icon=icons.get(threshold),
                )
            )
        return entries

    station_badges: list[CatalogBadge] = []
    for station in STATION_BADGES:
        station_badges += build(f"station_{station}", current_value=0)

    return (
        build("attendance", total_visits)
        + build("streak", member.longest_streak)
        + build("weekly_streak", member.longest_weekly_streak)
        + station_badges
    )
