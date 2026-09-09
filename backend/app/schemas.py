from datetime import datetime

from pydantic import BaseModel


class TapIn(BaseModel):
    tag_id: str
    reader_id: str
    timestamp: datetime | None = None


class TapResult(BaseModel):
    status: str  # "recorded" | "duplicate" | "unknown_tag"
    member_id: int | None = None
    points_awarded: int = 0
    points_balance: int | None = None
    current_streak: int | None = None
    longest_streak: int | None = None
