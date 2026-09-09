from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import TapIn, TapResult
from app.services.tap_service import record_tap

router = APIRouter(prefix="/taps", tags=["taps"])


@router.post("", response_model=TapResult)
def create_tap(tap_in: TapIn, db: Session = Depends(get_db)):
    return record_tap(db, tap_in)
