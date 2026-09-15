from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WheelSpin(Base):
    """A single Spin the Wheel result — kept as a history/audit log. Not used to enforce
    the once-per-day cooldown (that's Member.last_spin_date); this is just a record."""

    __tablename__ = "wheel_spins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False, index=True)
    prize_label: Mapped[str] = mapped_column(String, nullable=False)
    xp_awarded: Mapped[int] = mapped_column(Integer, nullable=False)
    spun_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
