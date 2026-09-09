from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Member, Tap
from app.schemas import MemberOut

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/{member_id}", response_model=MemberOut)
def get_member(member_id: int, db: Session = Depends(get_db)):
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    total_visits = db.query(func.count(Tap.id)).filter(Tap.member_id == member.id).scalar()

    return MemberOut(
        id=member.id,
        name=member.name,
        points_balance=member.points_balance,
        current_streak=member.current_streak,
        longest_streak=member.longest_streak,
        last_tap_date=member.last_tap_date,
        total_visits=total_visits,
        member_since=member.created_at,
    )
