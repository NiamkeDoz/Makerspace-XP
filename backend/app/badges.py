"""Config-driven badge thresholds, derived from existing lifetime stats
(total_visits, longest_streak) rather than persisted — no migration, no
risk of badge state drifting from the numbers that define it.
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


def earned(thresholds: list[tuple[int, str]], value: int) -> list[dict]:
    return [{"threshold": threshold, "name": name} for threshold, name in thresholds if value >= threshold]


def next_threshold(thresholds: list[tuple[int, str]], value: int) -> dict | None:
    for threshold, name in thresholds:
        if value < threshold:
            return {"threshold": threshold, "name": name, "remaining": threshold - value}
    return None
