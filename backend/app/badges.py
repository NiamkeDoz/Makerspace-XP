"""Config-driven badge thresholds. Earned badges are persisted (see
app/models/member_badge.py) with an earned_at timestamp, detected via
newly_crossed() at tap-time; next_threshold() derives the not-yet-earned
badge live from current stats, since that one isn't persisted.
"""

# (threshold in total visits, name) — "Maker" theme, sorted ascending.
ATTENDANCE_BADGES = [
    (1, "First Spark"),
    (5, "Getting Wired"),
    (10, "Tinkerer"),
    (30, "Workbench Regular"),
    (50, "Fabricator"),
    (100, "Machinist"),
    (200, "Master Craftsman"),
    (300, "Shop Foreman"),
    (365, "Full Circle"),
    (500, "Forge Legend"),
    (750, "Architect of the Space"),
    (1000, "Founding Spirit"),
]

# (threshold in consecutive days, name) — "Modern/Minimal" theme, sorted ascending.
STREAK_BADGES = [
    (7, "Momentum"),
    (14, "Consistency"),
    (21, "Discipline"),
    (30, "Habit Formed"),
    (90, "Locked In"),
    (180, "Unstoppable"),
    (270, "Relentless"),
    (365, "Year One"),
]


# (threshold in consecutive weeks with >=1 check-in, name) — a "month" is treated as 4 weeks,
# so 12 months = 48 weeks (a clean approximation, not calendar-exact).
WEEKLY_STREAK_BADGES = [
    (4, "1-Month Streak"),
    (8, "2-Month Streak"),
    (12, "Quarter Streak"),
    (16, "4-Month Streak"),
    (20, "5-Month Streak"),
    (24, "Half-Year Streak"),
    (28, "7-Month Streak"),
    (32, "8-Month Streak"),
    (36, "Three-Quarter Streak"),
    (40, "10-Month Streak"),
    (44, "11-Month Streak"),
    (48, "Year-Long Streak"),
]


# (threshold in uses of that station, name) — per-station badges, "maker" theme per craft.
# NOT YET WIRED UP: nothing currently records which station a tap/visit was for, so these
# can't be earned yet. Defined here as a placeholder catalog so the names/thresholds are
# settled ahead of time. See Issues/014 in the Obsidian vault for the tracking work needed.
STATION_BADGES: dict[str, list[tuple[int, str]]] = {
    "laser_cutter": [
        (1, "First Beam"),
        (10, "Kerf Curious"),
        (25, "Laser Focused"),
        (50, "Beam Master"),
    ],
    "3d_printing": [
        (1, "First Layer"),
        (10, "Print Run"),
        (25, "Layer by Layer"),
        (50, "Filament Fanatic"),
    ],
    "cricut": [
        (1, "First Snip"),
        (10, "Vinyl Veteran"),
        (25, "Cut It Out"),
        (50, "Cricut Connoisseur"),
    ],
    "resin": [
        (1, "First Pour"),
        (10, "Cured & Confident"),
        (25, "Resin Regular"),
        (50, "Pour Master"),
    ],
    "crochet": [
        (1, "First Stitch"),
        (10, "Hook, Line & Sinker"),
        (25, "Yarn Over Achiever"),
        (50, "Crochet Legend"),
    ],
    "woodshop": [
        (1, "Sawdust Rookie"),
        (10, "Board Certified"),
        (25, "Measure Twice"),
        (50, "Master Woodwright"),
    ],
}


def next_threshold(thresholds: list[tuple[int, str]], value: int) -> dict | None:
    for threshold, name in thresholds:
        if value < threshold:
            return {"threshold": threshold, "name": name, "remaining": threshold - value}
    return None


def newly_crossed(thresholds: list[tuple[int, str]], before: int, after: int) -> list[tuple[int, str]]:
    """Thresholds strictly crossed by this update, i.e. not met before but met now."""
    return [(threshold, name) for threshold, name in thresholds if before < threshold <= after]
