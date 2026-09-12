from datetime import date, datetime

from pydantic import BaseModel, Field


class Badge(BaseModel):
    threshold: int
    name: str
    earned_at: datetime = Field(description="When this badge was first earned (persisted, not recomputed).")

    class Config:
        from_attributes = True


class NextBadge(BaseModel):
    threshold: int
    name: str
    remaining: int = Field(description="How many more (visits or streak-days) until this badge is earned.")


class CatalogBadge(BaseModel):
    category: str = Field(description='"attendance" | "streak" | "weekly_streak".')
    threshold: int
    name: str
    earned: bool
    earned_at: datetime | None = Field(description="Set only when earned.")
    remaining: int | None = Field(description="Set only when not yet earned.")


class MemberOut(BaseModel):
    id: int
    name: str
    points_balance: int
    current_streak: int
    longest_streak: int
    current_weekly_streak: int = Field(description="Consecutive weeks (Mon-Sun) with at least one check-in.")
    longest_weekly_streak: int = Field(description="Record consecutive weekly-check-in streak.")
    level: int
    xp: int = Field(description="XP earned since the last prestige; drives `level`.")
    xp_to_next: int | None = Field(description="XP needed to reach the next level. `null` at max level.")
    xp_into_level: int = Field(description="XP earned within the current level (numerator for a progress bar).")
    xp_for_level: int | None = Field(
        description="Total XP span required to complete the current level (denominator for a progress bar). `null` at max level."
    )
    lifetime_xp: int = Field(description="Total XP earned across all time; survives prestige resets.")
    prestige_count: int
    last_tap_date: date | None
    total_visits: int = Field(description="Count of check-in/check-out visits, not raw tap rows.")
    member_since: datetime
    attendance_badges: list[Badge] = Field(description="Attendance milestone badges earned, with earned_at timestamps.")
    streak_badges: list[Badge] = Field(description="Streak milestone badges earned, with earned_at timestamps.")
    weekly_streak_badges: list[Badge] = Field(description="Weekly check-in streak badges earned (1-12 months).")
    next_attendance_badge: NextBadge | None = Field(description="Next unearned attendance badge, if any remain.")
    next_streak_badge: NextBadge | None = Field(description="Next unearned streak badge, if any remain.")
    next_weekly_streak_badge: NextBadge | None = Field(description="Next unearned weekly-streak badge, if any remain.")

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
    level: int
    xp: int
    lifetime_xp: int
    prestige_count: int
    last_tap_date: date | None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminEnrollIn(BaseModel):
    tag_id: str
    name: str


class AdminAdjustIn(BaseModel):
    points_balance: int | None = Field(default=None, description="New points balance. Omit to leave unchanged.")
    current_streak: int | None = Field(
        default=None,
        description="New current streak (days). Also raises longest_streak if this exceeds it. Omit to leave unchanged.",
    )


class TapIn(BaseModel):
    tag_id: str = Field(description="The NFC tag's unique identifier.")
    reader_id: str = Field(description="Which physical reader/door this tap came from.")
    timestamp: datetime | None = Field(default=None, description="Defaults to now if omitted.")
    name: str | None = Field(
        default=None,
        description="Name for a new member. Only used when `tag_id` is unrecognized — supplied by the kiosk after an `unknown_tag` response.",
    )


class TapResult(BaseModel):
    status: str = Field(description='One of: "recorded" | "duplicate" | "unknown_tag" | "enrolled" | "checked_out".')
    member_id: int | None = None
    name: str | None = None
    points_awarded: int = 0
    points_balance: int | None = None
    current_streak: int | None = None
    longest_streak: int | None = None
    current_weekly_streak: int | None = None
    longest_weekly_streak: int | None = None
    xp_awarded: int = 0
    level: int | None = None
    leveled_up: bool = Field(default=False, description="True if this tap crossed a level threshold.")
    badges_awarded: list[Badge] = Field(default_factory=list, description="Any badges newly earned by this tap.")


class OccupancyEntry(BaseModel):
    member_id: int
    name: str
    check_in: datetime
    check_in_reader_id: str
