from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tag_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    points_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_weekly_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # consecutive weeks with >=1 check-in
    longest_weekly_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_check_in_week: Mapped[date | None] = mapped_column(Date, nullable=True)  # Monday of the ISO week of the last check-in
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # earned since last prestige; drives level
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    lifetime_xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # survives prestige resets
    prestige_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_tap_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_spin_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # one wheel spin per calendar day
    # Admin-granted extra spins, usable regardless of last_spin_date — e.g. a makeup spin
    # for a missed day, or an event prize. Consumed after the daily free spin is used.
    bonus_spins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Free-text Discord handle (e.g. "jamie" or "jamie#1234"), collected ahead of the bot
    # integration that will use it for DM notifications — see Wishlist/002. Not validated
    # or linked to a real Discord account yet, just stored for when that lands.
    discord_username: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    taps = relationship("Tap", back_populates="member")
