from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Member, Visit
from app.schemas import OccupancyEntry

router = APIRouter(prefix="/occupancy", tags=["occupancy"])


@router.get("", response_model=list[OccupancyEntry])
def get_occupancy(db: Session = Depends(get_db)):
    open_visits = (
        db.query(Visit, Member.name)
        .join(Member, Member.id == Visit.member_id)
        .filter(Visit.check_out.is_(None))
        .order_by(Visit.check_in.asc())
        .all()
    )

    return [
        OccupancyEntry(
            member_id=visit.member_id,
            name=name,
            check_in=visit.check_in,
            check_in_reader_id=visit.check_in_reader_id,
        )
        for visit, name in open_visits
    ]
