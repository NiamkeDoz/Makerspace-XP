import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Member, WheelSpin
from app.schemas import SpinResult, WheelPrize, WheelStatus
from app.wheel_rules import WHEEL_PRIZES
from app.xp_rules import level_for_xp

router = APIRouter(prefix="/members", tags=["wheel"])


def _prize_table() -> list[WheelPrize]:
    return [WheelPrize(label=label, xp_amount=xp, weight=weight) for weight, xp, label in WHEEL_PRIZES]


@router.get(
    "/{member_id}/wheel",
    response_model=WheelStatus,
    summary="Whether a member can spin the wheel today, plus the prize table",
)
def get_wheel_status(member_id: int, db: Session = Depends(get_db)):
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    today = datetime.utcnow().date()
    daily_available = member.last_spin_date != today
    can_spin = daily_available or member.bonus_spins > 0
    next_spin_date = None if daily_available else today + timedelta(days=1)

    last_spin = (
        db.query(WheelSpin).filter(WheelSpin.member_id == member.id).order_by(WheelSpin.spun_at.desc()).first()
    )

    return WheelStatus(
        can_spin=can_spin,
        next_spin_date=next_spin_date,
        bonus_spins=member.bonus_spins,
        prizes=_prize_table(),
        last_prize_label=last_spin.prize_label if last_spin else None,
    )


@router.post(
    "/{member_id}/wheel/spin",
    response_model=SpinResult,
    summary="Spin the wheel — one spin per member per calendar day",
)
def spin_wheel(member_id: int, db: Session = Depends(get_db)):
    member = db.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    today = datetime.utcnow().date()
    daily_available = member.last_spin_date != today
    if not daily_available and member.bonus_spins <= 0:
        raise HTTPException(status_code=409, detail="Already spun today — come back tomorrow.")

    weights = [weight for weight, _xp, _label in WHEEL_PRIZES]
    weight, xp_amount, label = random.choices(WHEEL_PRIZES, weights=weights, k=1)[0]

    used_bonus_spin = not daily_available
    if daily_available:
        member.last_spin_date = today
    else:
        member.bonus_spins -= 1

    previous_level = member.level
    if xp_amount > 0:
        member.xp += xp_amount
        member.lifetime_xp += xp_amount
        member.level = level_for_xp(member.xp)
    leveled_up = member.level > previous_level

    db.add(WheelSpin(member_id=member.id, prize_label=label, xp_awarded=xp_amount))
    db.commit()
    db.refresh(member)

    return SpinResult(
        prize_label=label,
        xp_awarded=xp_amount,
        level=member.level,
        xp=member.xp,
        lifetime_xp=member.lifetime_xp,
        leveled_up=leveled_up,
        used_bonus_spin=used_bonus_spin,
        bonus_spins=member.bonus_spins,
        next_spin_date=today + timedelta(days=1),
    )
