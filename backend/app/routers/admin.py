from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Member
from app.schemas import AdminAdjustIn, AdminEnrollIn, AdminMemberOut, AdminSettingsIn, AdminSettingsOut
from app.services.settings_service import get_settings
from app.xp_rules import MAX_LEVEL

# All routes below require an X-Admin-Token header matching the server's ADMIN_TOKEN.
# Missing/wrong token -> 401 (or 422 if the header is omitted entirely).
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/members", response_model=list[AdminMemberOut], summary="List all members (admin)")
def list_members(db: Session = Depends(get_db)):
    """All members, alphabetical by name, including fields not exposed publicly (`tag_id`, `created_at`)."""
    return db.query(Member).order_by(Member.name.asc()).all()


@router.post(
    "/members",
    response_model=AdminMemberOut,
    status_code=201,
    summary="Manually enroll a member (admin)",
)
def enroll_member(body: AdminEnrollIn, db: Session = Depends(get_db)):
    """Enroll a member without a physical tap — e.g. pre-registering someone ahead of time."""
    member = Member(tag_id=body.tag_id, name=f"{body.first_name} {body.last_name}".strip())
    if body.member_since is not None:
        member.created_at = datetime.combine(body.member_since, time.min)
    db.add(member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="tag_id already registered")
    db.refresh(member)
    return member


@router.patch(
    "/members/{member_id}",
    response_model=AdminMemberOut,
    summary="Correct a member's points/streak (admin)",
)
def adjust_member(member_id: int, body: AdminAdjustIn, db: Session = Depends(get_db)):
    """
    Manually fix a member's points or streak — for misfired readers, lost tags, or disputed
    streaks, without touching SQL directly. Both fields optional; only provided fields change.
    Setting `current_streak` also raises `longest_streak` if the new value exceeds it (never
    lowers it).
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    if body.points_balance is not None:
        member.points_balance = body.points_balance
    if body.current_streak is not None:
        member.current_streak = body.current_streak
        member.longest_streak = max(member.longest_streak, body.current_streak)

    db.commit()
    db.refresh(member)
    return member


@router.post(
    "/members/{member_id}/prestige",
    response_model=AdminMemberOut,
    summary="Prestige a member at max level (admin)",
)
def prestige_member(member_id: int, db: Session = Depends(get_db)):
    """
    Resets a member from level 20 back to level 1 / 0 XP and increments `prestige_count`.
    `points_balance`, streaks, and `lifetime_xp` are untouched by design — prestige is cosmetic
    progression, not punishing. Requires the member to already be at max level.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.level < MAX_LEVEL:
        raise HTTPException(status_code=400, detail=f"Member must reach level {MAX_LEVEL} to prestige")

    member.level = 1
    member.xp = 0
    member.prestige_count += 1
    # lifetime_xp, points_balance, streaks, and attendance history are untouched by design.

    db.commit()
    db.refresh(member)
    return member


@router.get("/settings", response_model=AdminSettingsOut, summary="Get tunable settings (admin)")
def get_app_settings(db: Session = Depends(get_db)):
    """Currently just the base points/XP awarded per tap-in; more knobs can join this later."""
    settings = get_settings(db)
    db.commit()
    return settings


@router.patch("/settings", response_model=AdminSettingsOut, summary="Update tunable settings (admin)")
def update_app_settings(body: AdminSettingsIn, db: Session = Depends(get_db)):
    """Changes take effect on the next tap-in; does not retroactively adjust past taps."""
    settings = get_settings(db)
    settings.base_points = body.base_points
    db.commit()
    db.refresh(settings)
    return settings
