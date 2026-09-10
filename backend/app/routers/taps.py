from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import TapIn, TapResult
from app.services.tap_service import record_tap

router = APIRouter(prefix="/taps", tags=["taps"])


@router.post(
    "",
    response_model=TapResult,
    summary="Record a tap (check-in/check-out, enrollment, points/XP)",
)
def create_tap(tap_in: TapIn, db: Session = Depends(get_db)):
    """
    The core endpoint — called by the ESP32 reader (or the Tap Simulator) on every physical tap.

    Behavior depends on the member's current state:
    - **Unknown tag, no `name`** → `unknown_tag`. Nothing recorded; client should prompt for a
      name and resubmit.
    - **Unknown tag, with `name`** → `enrolled`. Creates the member, then proceeds as a normal
      first check-in (points/XP awarded).
    - **Known tag, no open session** → `recorded` (first tap today, streak/points/XP awarded) or
      `duplicate` (already tapped in today — still opens a new session for occupancy tracking,
      but no extra points/XP; capped once per day).
    - **Known tag, has an open session** → `checked_out`. Closes the session. Never awards
      points/XP — arrival/departure tracking is fully separate from the daily reward.
    """
    return record_tap(db, tap_in)
