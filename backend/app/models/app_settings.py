from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.rules import BASE_POINTS


class AppSettings(Base):
    """Single-row table of admin-tunable settings. Always read/written via id=1."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    base_points: Mapped[int] = mapped_column(Integer, default=BASE_POINTS, nullable=False)
