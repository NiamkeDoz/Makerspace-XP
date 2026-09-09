from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Member
from app.schemas import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
def get_leaderboard(limit: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db)):
    members = (
        db.query(Member)
        .order_by(Member.points_balance.desc(), Member.id.asc())
        .limit(limit)
        .all()
    )

    return [
        LeaderboardEntry(
            rank=rank,
            member_id=member.id,
            name=member.name,
            points_balance=member.points_balance,
            current_streak=member.current_streak,
        )
        for rank, member in enumerate(members, start=1)
    ]
