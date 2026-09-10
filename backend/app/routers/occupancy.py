from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Member, Visit
from app.schemas import OccupancyEntry

router = APIRouter(prefix="/occupancy", tags=["occupancy"])


@router.get("", response_model=list[OccupancyEntry], summary="Who's currently checked in")
def get_occupancy(db: Session = Depends(get_db)):
    """
    Everyone with an open visit (checked in but hasn't checked out yet). Powers the
    "Currently In" panel on the home page, which polls this every 5 seconds. Not paginated —
    expected to stay small, bounded by how many people can physically be in the space at once.
    """
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
