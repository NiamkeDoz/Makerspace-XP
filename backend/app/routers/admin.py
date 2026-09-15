from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.badges import ALL_BADGE_CATALOGS, category_catalog

# Mirrors ICON_KEYS in frontend/src/components/badgeIcons.tsx — kept in sync by hand,
# since the icon set is a small fixed art asset list, not derived data.
CUSTOM_BADGE_ICON_KEYS = {
    "sparkle", "plug", "wrench", "toolbox", "cog", "gear-dot", "hammer", "clipboard-check",
    "target", "anvil", "compass", "star", "arrow-up-right", "calendar-check", "shield",
    "link", "lock", "zap", "flame", "trophy", "heart", "gift", "medal", "rocket", "book",
    "paintbrush", "leaf", "crown", "diamond", "puzzle",
}
from app.database import get_db
from app.models import CustomBadge, Member, MemberBadge, RetiredTag, Visit
from app.schemas import (
    AdminAdjustIn,
    AdminAwardBadgeIn,
    AdminCatalogBadge,
    AdminEnrollIn,
    AdminMemberOut,
    AdminReassignTagIn,
    AdminSettingsIn,
    AdminSettingsOut,
    CustomBadgeIn,
    CustomBadgeOut,
)
from app.services.settings_service import get_settings
from app.xp_rules import MAX_LEVEL, level_for_xp

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


@router.get("/members/{member_id}", response_model=AdminMemberOut, summary="Get one member's full admin record")
def get_admin_member(member_id: int, db: Session = Depends(get_db)):
    """Powers the admin edit page — same fields as the list view, fetched for one member."""
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


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
    summary="Correct a member's stats (admin)",
)
def adjust_member(member_id: int, body: AdminAdjustIn, db: Session = Depends(get_db)):
    """
    Manually fix a member's record — for misfired readers, disputed streaks, or data-entry
    mistakes, without touching SQL directly. Every field optional; only provided fields
    change. Setting `current_streak`/`current_weekly_streak` also raises the matching
    "longest" field if the new value exceeds it (never lowers it). Setting `xp` recomputes
    `level` to match, unless `level` is also provided in the same request (explicit `level`
    always wins).
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    if body.name is not None:
        member.name = body.name
    if body.discord_username is not None:
        member.discord_username = body.discord_username.strip() or None
    if body.points_balance is not None:
        member.points_balance = body.points_balance
    if body.current_streak is not None:
        member.current_streak = body.current_streak
        member.longest_streak = max(member.longest_streak, body.current_streak)
    if body.longest_streak is not None:
        member.longest_streak = body.longest_streak
    if body.current_weekly_streak is not None:
        member.current_weekly_streak = body.current_weekly_streak
        member.longest_weekly_streak = max(member.longest_weekly_streak, body.current_weekly_streak)
    if body.longest_weekly_streak is not None:
        member.longest_weekly_streak = body.longest_weekly_streak
    if body.xp is not None:
        member.xp = body.xp
        member.level = level_for_xp(body.xp)
    if body.level is not None:
        member.level = body.level
    if body.lifetime_xp is not None:
        member.lifetime_xp = body.lifetime_xp
    if body.prestige_count is not None:
        member.prestige_count = body.prestige_count
    if body.bonus_spins is not None:
        member.bonus_spins = body.bonus_spins
    if body.member_since is not None:
        member.created_at = datetime.combine(body.member_since, time.min)

    db.commit()
    db.refresh(member)
    return member


def _current_value_for_category(db: Session, member: Member, category: str) -> int:
    if category == "attendance":
        return db.query(func.count(Visit.id)).filter(Visit.member_id == member.id).scalar()
    if category == "streak":
        return member.longest_streak
    if category == "weekly_streak":
        return member.longest_weekly_streak
    return 0  # station_* categories aren't tracked yet — see Issues/014


@router.get(
    "/members/{member_id}/badges",
    response_model=list[AdminCatalogBadge],
    summary="Full badge catalog for a member, with revoke-capable ids (admin)",
)
def get_admin_member_badges(member_id: int, db: Session = Depends(get_db)):
    """
    Same catalog as the public `GET /members/{id}/badges`, but each earned entry also
    carries its `member_badges` row id (needed by `DELETE .../badges/{badge_id}`) and
    every category — including station badges — is awardable here regardless of whether
    it's normally earnable yet.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    earned_by_key = {(b.badge_type, b.threshold): b for b in db.query(MemberBadge).filter(MemberBadge.member_id == member.id).all()}

    out: list[AdminCatalogBadge] = []
    for category in ALL_BADGE_CATALOGS:
        thresholds, descriptions, icons = category_catalog(db, category)
        current_value = _current_value_for_category(db, member, category)
        for threshold, name in thresholds:
            earned = earned_by_key.get((category, threshold))
            out.append(
                AdminCatalogBadge(
                    id=earned.id if earned else None,
                    category=category,
                    threshold=threshold,
                    name=name,
                    earned=earned is not None,
                    earned_at=earned.earned_at if earned else None,
                    remaining=None if earned else max(threshold - current_value, 0),
                    description=descriptions.get(threshold),
                    icon=icons.get(threshold),
                )
            )
    return out


@router.post(
    "/members/{member_id}/badges",
    response_model=AdminCatalogBadge,
    status_code=201,
    summary="Manually award a badge to a member (admin)",
)
def award_badge(member_id: int, body: AdminAwardBadgeIn, db: Session = Depends(get_db)):
    """For correcting a missed award, or granting a special/one-off badge. If already
    earned, returns the existing record instead of erroring or duplicating it."""
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    if body.category not in ALL_BADGE_CATALOGS:
        raise HTTPException(status_code=400, detail=f"Unknown badge category: {body.category!r}")
    thresholds, descriptions, icons = category_catalog(db, body.category)
    name = next((n for t, n in thresholds if t == body.threshold), None)
    if name is None:
        raise HTTPException(status_code=400, detail=f"No badge at threshold {body.threshold} in category {body.category!r}")
    description = descriptions.get(body.threshold)
    icon = icons.get(body.threshold)

    existing = (
        db.query(MemberBadge)
        .filter(MemberBadge.member_id == member.id, MemberBadge.badge_type == body.category, MemberBadge.threshold == body.threshold)
        .one_or_none()
    )
    if existing is not None:
        return AdminCatalogBadge(
            id=existing.id,
            category=body.category,
            threshold=body.threshold,
            name=name,
            earned=True,
            earned_at=existing.earned_at,
            remaining=None,
            description=description,
            icon=icon,
        )

    badge = MemberBadge(member_id=member.id, badge_type=body.category, threshold=body.threshold, name=name, earned_at=datetime.utcnow())
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return AdminCatalogBadge(
        id=badge.id,
        category=body.category,
        threshold=body.threshold,
        name=name,
        earned=True,
        earned_at=badge.earned_at,
        remaining=None,
        description=description,
        icon=icon,
    )


@router.delete(
    "/members/{member_id}/badges/{badge_id}",
    status_code=204,
    summary="Revoke a badge from a member (admin)",
)
def revoke_badge(member_id: int, badge_id: int, db: Session = Depends(get_db)):
    """Deletes the earned-badge record outright — the member goes back to not having
    earned it, and it'll re-award naturally if they cross the threshold again later."""
    badge = db.get(MemberBadge, badge_id)
    if badge is None or badge.member_id != member_id:
        raise HTTPException(status_code=404, detail="Badge not found")
    db.delete(badge)
    db.commit()


@router.get(
    "/custom-badges",
    response_model=list[CustomBadgeOut],
    summary="List admin-created custom badges",
)
def list_custom_badges(db: Session = Depends(get_db)):
    """All custom badges, newest first. These are merged into the regular catalog (see
    `category_catalog()`) everywhere badges are listed, awarded, or checked."""
    return db.query(CustomBadge).order_by(CustomBadge.created_at.desc()).all()


@router.post(
    "/custom-badges",
    response_model=CustomBadgeOut,
    status_code=201,
    summary="Create a custom badge",
)
def create_custom_badge(body: CustomBadgeIn, db: Session = Depends(get_db)):
    """
    Adds a new badge to an existing category's catalog. Attendance/streak/weekly_streak
    badges are auto-awarded at tap-time exactly like built-in ones, the moment a member
    crosses the threshold; station badges join the existing manual-award-only station
    badges (nothing tracks station usage yet — see Issues/014).
    """
    if body.category not in ALL_BADGE_CATALOGS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown category: {body.category!r}. Must be one of: {', '.join(sorted(ALL_BADGE_CATALOGS))}",
        )

    static_thresholds = {t for t, _n in ALL_BADGE_CATALOGS[body.category]}
    if body.threshold in static_thresholds:
        raise HTTPException(status_code=409, detail=f"A built-in badge already uses threshold {body.threshold} in this category")

    if body.icon not in CUSTOM_BADGE_ICON_KEYS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown icon: {body.icon!r}. Must be one of: {', '.join(sorted(CUSTOM_BADGE_ICON_KEYS))}",
        )

    badge = CustomBadge(
        category=body.category,
        threshold=body.threshold,
        name=body.name.strip(),
        description=body.description.strip(),
        icon=body.icon,
    )
    db.add(badge)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A custom badge already uses that threshold in this category")
    db.refresh(badge)
    return badge


@router.delete(
    "/custom-badges/{custom_badge_id}",
    status_code=204,
    summary="Delete a custom badge",
)
def delete_custom_badge(custom_badge_id: int, db: Session = Depends(get_db)):
    """Removes it from the catalog going forward. Anyone who already earned it keeps
    their `member_badges` record — deleting the definition doesn't retroactively revoke it."""
    badge = db.get(CustomBadge, custom_badge_id)
    if badge is None:
        raise HTTPException(status_code=404, detail="Custom badge not found")
    db.delete(badge)
    db.commit()


@router.patch(
    "/members/{member_id}/tag",
    response_model=AdminMemberOut,
    summary="Reassign a member's tag — e.g. a lost card (admin)",
)
def reassign_tag(member_id: int, body: AdminReassignTagIn, db: Session = Depends(get_db)):
    """
    Swaps a member's tag_id to a new card. The old tag is recorded in `retired_tags`
    (with which member it belonged to) rather than just being dropped, so if it's ever
    tapped again — someone finds the lost card — record_tap() recognizes it as retired
    and rejects it instead of silently enrolling a new member under it.
    """
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if body.new_tag_id == member.tag_id:
        raise HTTPException(status_code=400, detail="New tag is the same as the current tag")

    old_tag_id = member.tag_id
    member.tag_id = body.new_tag_id
    db.add(RetiredTag(tag_id=old_tag_id, member_id=member.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tag already registered to another member")
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


def _settings_out(settings) -> AdminSettingsOut:
    now = datetime.now(timezone.utc)
    active = (
        settings.double_xp_start is not None
        and settings.double_xp_end is not None
        and settings.double_xp_start <= now <= settings.double_xp_end
    )
    return AdminSettingsOut(
        base_points=settings.base_points,
        backups_enabled=settings.backups_enabled,
        double_xp_start=settings.double_xp_start,
        double_xp_end=settings.double_xp_end,
        double_xp_active=active,
    )


@router.get("/settings", response_model=AdminSettingsOut, summary="Get tunable settings (admin)")
def get_app_settings(db: Session = Depends(get_db)):
    """Base XP per tap-in, backups, and the scheduled double-XP window."""
    settings = get_settings(db)
    db.commit()
    return _settings_out(settings)


@router.patch("/settings", response_model=AdminSettingsOut, summary="Update tunable settings (admin)")
def update_app_settings(body: AdminSettingsIn, db: Session = Depends(get_db)):
    """
    All fields optional; only fields actually present in the request body change (a
    field can be omitted to leave it alone — that's different from sending it as
    `null`, which for `double_xp_start`/`double_xp_end` explicitly clears the window).
    `base_points` changes take effect on the next tap-in — does not retroactively adjust
    past taps. `backups_enabled` is read by the nightly backup script
    (`backend/scripts/backup_db.sh`) directly against the database, not through this API
    — flipping it here changes what that script does on its next scheduled run.
    """
    settings = get_settings(db)
    fields_set = body.model_fields_set

    if body.base_points is not None:
        settings.base_points = body.base_points
    if body.backups_enabled is not None:
        settings.backups_enabled = body.backups_enabled
    if "double_xp_start" in fields_set:
        settings.double_xp_start = body.double_xp_start
    if "double_xp_end" in fields_set:
        settings.double_xp_end = body.double_xp_end

    if settings.double_xp_start is not None and settings.double_xp_end is not None and settings.double_xp_start > settings.double_xp_end:
        raise HTTPException(status_code=400, detail="double_xp_start must be before double_xp_end")

    db.commit()
    db.refresh(settings)
    return _settings_out(settings)
