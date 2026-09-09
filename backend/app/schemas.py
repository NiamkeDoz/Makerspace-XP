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


class AdminMemberOut(BaseModel):
    id: int
    tag_id: str
    name: str
    points_balance: int
    current_streak: int
    longest_streak: int
    last_tap_date: date | None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminEnrollIn(BaseModel):
    tag_id: str
    name: str


class AdminAdjustIn(BaseModel):
    points_balance: int | None = None
    current_streak: int | None = None


class TapIn(BaseModel):
    tag_id: str
    reader_id: str
    timestamp: datetime | None = None
    name: str | None = None  # supplied by the kiosk once, after an unknown_tag response


class TapResult(BaseModel):
    status: str  # "recorded" | "duplicate" | "unknown_tag" | "enrolled"
    member_id: int | None = None
    name: str | None = None
    points_awarded: int = 0
    points_balance: int | None = None
    current_streak: int | None = None
    longest_streak: int | None = None
