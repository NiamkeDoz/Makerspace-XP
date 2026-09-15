from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RetiredTag(Base):
    """A tag_id that used to belong to a member but was reassigned (e.g. a lost card).
    Kept so the old tag is recognized and rejected if it's ever tapped again, instead of
    silently enrolling a new member under a card that's actually lost."""

    __tablename__ = "retired_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tag_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False, index=True)
    retired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
