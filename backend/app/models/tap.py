from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tap(Base):
    __tablename__ = "taps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False, index=True)
    reader_id: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    points_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    direction: Mapped[str] = mapped_column(String, default="in", nullable=False)  # "in" | "out"

    member = relationship("Member", back_populates="taps")
