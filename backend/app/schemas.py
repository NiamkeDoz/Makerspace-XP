from datetime import date, datetime

from pydantic import BaseModel


class MemberOut(BaseModel):
    id: int
    name: str
    points_balance: int
    current_streak: int
    longest_streak: int
    last_tap_date: date | None
    total_visits: int
    member_since: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    member_id: int
    name: str
    points_balance: int
    current_streak: int


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
