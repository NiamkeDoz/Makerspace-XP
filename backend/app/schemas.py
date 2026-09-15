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
    description: str | None = Field(default=None, description="Set only for admin-created custom badges.")
    icon: str | None = Field(default=None, description="Set only for admin-created custom badges — an icon key from the frontend's icon registry.")


class CatalogBadge(BaseModel):
    category: str = Field(description='"attendance" | "streak" | "weekly_streak" | "station_<key>".')
    threshold: int
    name: str
    earned: bool
    earned_at: datetime | None = Field(description="Set only when earned.")
    remaining: int | None = Field(description="Set only when not yet earned.")
    description: str | None = Field(
        default=None,
        description="Set only for admin-created custom badges. Built-in badges have no stored description — the frontend derives one from category+threshold instead.",
    )
    icon: str | None = Field(default=None, description="Set only for admin-created custom badges — an icon key from the frontend's icon registry.")


class MemberIdOut(BaseModel):
    id: int


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
    current_weekly_streak: int
    longest_weekly_streak: int
    level: int
    xp: int
    lifetime_xp: int
    prestige_count: int
    bonus_spins: int = Field(description="Admin-granted extra Spin the Wheel spins, usable even after the daily free spin is gone.")
    last_tap_date: date | None
    discord_username: str | None = Field(
        description="Free-text Discord handle, collected ahead of the future bot integration (see Wishlist/002)."
    )
    created_at: datetime

    class Config:
        from_attributes = True


class AdminEnrollIn(BaseModel):
    tag_id: str
    first_name: str
    last_name: str
    member_since: date | None = Field(
        default=None, description="Backdate enrollment (e.g. someone who's attended before getting a tag). Defaults to today."
    )


class AdminReassignTagIn(BaseModel):
    new_tag_id: str = Field(description="The new card's tag ID. The old tag is retired, not deleted.")


class AdminAdjustIn(BaseModel):
    """Full correction form for a member's stats — every field optional, only provided
    fields change. For fixing mistakes (misfired readers, disputed streaks, data entry
    errors), not routine play."""

    name: str | None = Field(default=None, description="Corrected display name. Omit to leave unchanged.")
    discord_username: str | None = Field(
        default=None,
        description="Discord handle for the future bot/DM integration. Send an empty string to clear it. Omit to leave unchanged.",
    )
    points_balance: int | None = Field(default=None, description="New points balance. Omit to leave unchanged.")
    current_streak: int | None = Field(
        default=None,
        description="New current streak (days). Also raises longest_streak if this exceeds it. Omit to leave unchanged.",
    )
    longest_streak: int | None = Field(
        default=None, description="New longest daily streak (days). Omit to leave unchanged."
    )
    current_weekly_streak: int | None = Field(
        default=None,
        description="New current weekly streak (weeks). Also raises longest_weekly_streak if this exceeds it. Omit to leave unchanged.",
    )
    longest_weekly_streak: int | None = Field(
        default=None, description="New longest weekly streak (weeks). Omit to leave unchanged."
    )
    xp: int | None = Field(
        default=None,
        description="New XP total since last prestige. Recomputes `level` from this value unless `level` is also provided. Omit to leave unchanged.",
    )
    level: int | None = Field(
        default=None, description="New level, overriding the value XP would imply. Omit to leave unchanged."
    )
    lifetime_xp: int | None = Field(default=None, description="New lifetime XP total. Omit to leave unchanged.")
    prestige_count: int | None = Field(default=None, description="New prestige count. Omit to leave unchanged.")
    bonus_spins: int | None = Field(
        default=None,
        description="New bonus-spins count (adds to, not consumed by, the free daily spin). Omit to leave unchanged.",
    )
    member_since: date | None = Field(
        default=None,
        description="Corrected enrollment date, shown as 'member since'. Time-of-day is reset to midnight UTC. Omit to leave unchanged.",
    )


class AdminCatalogBadge(BaseModel):
    id: int | None = Field(description="The earned member_badges row id — present only when earned. Needed to revoke.")
    category: str = Field(description='"attendance" | "streak" | "weekly_streak" | "station_<key>".')
    threshold: int
    name: str
    earned: bool
    earned_at: datetime | None = Field(description="Set only when earned.")
    remaining: int | None = Field(description="Set only when not yet earned.")
    description: str | None = Field(default=None, description="Set only for admin-created custom badges.")
    icon: str | None = Field(default=None, description="Set only for admin-created custom badges — an icon key from the frontend's icon registry.")


class AdminAwardBadgeIn(BaseModel):
    category: str = Field(description='Which catalog, e.g. "attendance", "streak", "weekly_streak", "station_laser_cutter".')
    threshold: int = Field(description="Threshold identifying which badge in that category's catalog to award.")


class CustomBadgeOut(BaseModel):
    id: int
    category: str
    threshold: int
    name: str
    description: str
    icon: str
    created_at: datetime

    class Config:
        from_attributes = True


class CustomBadgeIn(BaseModel):
    category: str = Field(
        description='Which catalog this joins, e.g. "attendance", "streak", "weekly_streak", or "station_laser_cutter". '
        "Attendance/streak/weekly_streak badges are auto-awarded at tap-time like built-in ones; station badges stay manual-award-only."
    )
    threshold: int = Field(gt=0, description="Crossing this value earns the badge (visits, days, weeks, or station uses depending on category).")
    name: str = Field(min_length=1, description="Badge display name.")
    description: str = Field(min_length=1, description="Shown in the badge detail modal.")
    icon: str = Field(min_length=1, description="Icon key from the frontend's icon registry, e.g. 'trophy', 'flame'.")


class AdminSettingsOut(BaseModel):
    base_points: int = Field(description="Points (and XP) awarded for a streak-1 check-in tap; scaled up by the streak multiplier.")
    backups_enabled: bool = Field(
        description="Whether the nightly DB backup script actually runs, or just checks in and exits. Defaults off."
    )
    double_xp_start: datetime | None = Field(description="Start of the scheduled double-XP window, if any.")
    double_xp_end: datetime | None = Field(description="End of the scheduled double-XP window, if any.")
    double_xp_active: bool = Field(description="True if a double-XP window is set and the current time falls inside it.")

    class Config:
        from_attributes = True


class AdminSettingsIn(BaseModel):
    base_points: int | None = Field(default=None, ge=1, description="New base points-per-tap value. Omit to leave unchanged.")
    backups_enabled: bool | None = Field(default=None, description="Turn nightly DB backups on/off. Omit to leave unchanged.")
    double_xp_start: datetime | None = Field(
        default=None,
        description="Start of the double-XP window. Include this key with `null` to clear it; omit the key entirely to leave unchanged.",
    )
    double_xp_end: datetime | None = Field(
        default=None,
        description="End of the double-XP window. Include this key with `null` to clear it; omit the key entirely to leave unchanged.",
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
    status: str = Field(
        description='One of: "recorded" | "duplicate" | "unknown_tag" | "enrolled" | "checked_out" | "retired_tag".'
    )
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
    double_xp_applied: bool = Field(default=False, description="True if the scheduled double-XP window was active for this tap.")


class OccupancyEntry(BaseModel):
    member_id: int
    name: str
    check_in: datetime
    check_in_reader_id: str


class WheelPrize(BaseModel):
    label: str
    xp_amount: int
    weight: int = Field(description="Relative odds weight — segment size on the wheel is proportional to this.")


class WheelStatus(BaseModel):
    can_spin: bool
    next_spin_date: date | None = Field(
        description="First date the free daily spin resets. Null if the free spin is available now."
    )
    bonus_spins: int = Field(description="Admin-granted extra spins, usable even if the free daily spin is gone.")
    prizes: list[WheelPrize] = Field(description="The full prize table, for rendering the wheel's segments.")
    last_prize_label: str | None = Field(description="What they won on their most recent spin, if any.")


class SpinResult(BaseModel):
    prize_label: str
    xp_awarded: int
    level: int
    xp: int
    lifetime_xp: int
    leveled_up: bool
    used_bonus_spin: bool = Field(description="True if this spin consumed a bonus spin rather than the free daily one.")
    bonus_spins: int = Field(description="Bonus spins remaining after this spin.")
    next_spin_date: date
