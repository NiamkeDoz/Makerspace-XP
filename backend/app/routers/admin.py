from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Member
from app.schemas import AdminAdjustIn, AdminEnrollIn, AdminMemberOut
from app.xp_rules import MAX_LEVEL

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/members", response_model=list[AdminMemberOut])
def list_members(db: Session = Depends(get_db)):
    return db.query(Member).order_by(Member.name.asc()).all()


@router.post("/members", response_model=AdminMemberOut, status_code=201)
def enroll_member(body: AdminEnrollIn, db: Session = Depends(get_db)):
    member = Member(tag_id=body.tag_id, name=body.name)
    db.add(member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="tag_id already registered")
    db.refresh(member)
    return member


@router.patch("/members/{member_id}", response_model=AdminMemberOut)
def adjust_member(member_id: int, body: AdminAdjustIn, db: Session = Depends(get_db)):
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


@router.post("/members/{member_id}/prestige", response_model=AdminMemberOut)
def prestige_member(member_id: int, db: Session = Depends(get_db)):
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
