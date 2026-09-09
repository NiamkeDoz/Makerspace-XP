"""Config-driven point/streak rules, retunable without a migration."""

BASE_POINTS = 10

# (min_streak_days, multiplier) sorted ascending; last matching threshold wins.
STREAK_MULTIPLIERS = [
    (1, 1.0),
    (3, 1.25),
    (7, 1.5),
    (14, 1.75),
    (30, 2.0),
]


def streak_multiplier(streak: int) -> float:
    multiplier = STREAK_MULTIPLIERS[0][1]
    for threshold, value in STREAK_MULTIPLIERS:
        if streak >= threshold:
            multiplier = value
    return multiplier


def points_for_streak(streak: int) -> int:
    return round(BASE_POINTS * streak_multiplier(streak))
