from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.rules import BASE_POINTS


class AppSettings(Base):
    """Single-row table of admin-tunable settings. Always read/written via id=1."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    base_points: Mapped[int] = mapped_column(Integer, default=BASE_POINTS, nullable=False)
    backups_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Double-XP window: while now() is between these (inclusive), all XP/points earned on
    # a tap-in are multiplied 2x, stacking with (not replacing) the streak multiplier.
    # Both null = no window scheduled. Set independently of each other so a window can be
    # open-ended while it's being planned, then closed off once an end date is picked.
    double_xp_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    double_xp_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
