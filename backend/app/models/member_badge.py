from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MemberBadge(Base):
    """A badge a member has actually earned, with the moment it was first crossed.
    Awarded once at tap-time and never recomputed retroactively."""

    __tablename__ = "member_badges"
    __table_args__ = (UniqueConstraint("member_id", "badge_type", "threshold", name="uq_member_badge"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False, index=True)
    badge_type: Mapped[str] = mapped_column(String, nullable=False)  # "attendance" | "streak"
    threshold: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
