from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CustomBadge(Base):
    """An admin-defined badge, merged into the built-in catalog for its category (see
    app/badges.py's category_catalog()). For attendance/streak/weekly_streak categories
    these are auto-awarded at tap-time exactly like built-in badges (same newly_crossed()
    check, just against a threshold list that includes these too); station categories
    stay manual-award-only, same limitation the built-in station badges have."""

    __tablename__ = "custom_badges"
    __table_args__ = (UniqueConstraint("category", "threshold", name="uq_custom_badge_category_threshold"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    threshold: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=False, server_default="sparkle")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
