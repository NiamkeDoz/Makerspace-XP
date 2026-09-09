"""Config-driven XP/leveling curve, retunable without touching leveling logic."""

MAX_LEVEL = 20

# Cumulative XP required to *reach* each level, starting from 0 at level 1.
# Matches the project spec's xp_to_next = 100 * level^1.5 (rounded to nearest 10) table.
LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 380,
    4: 900,
    5: 1700,
    6: 2820,
    7: 4290,
    8: 6140,
    9: 8400,
    10: 11100,
    11: 14260,
    12: 17910,
    13: 22070,
    14: 26760,
    15: 32010,
    16: 37830,
    17: 44240,
    18: 51260,
    19: 58910,
    20: 67210,
}


def level_for_xp(xp: int) -> int:
    level = 1
    for lvl, threshold in LEVEL_THRESHOLDS.items():
        if xp >= threshold:
            level = lvl
    return level


def xp_to_next_level(xp: int, level: int) -> int | None:
    if level >= MAX_LEVEL:
        return None
    return LEVEL_THRESHOLDS[level + 1] - xp


def xp_into_level(xp: int, level: int) -> int:
    return xp - LEVEL_THRESHOLDS[level]


def xp_for_level(level: int) -> int | None:
    """Total XP span required to complete this level (None at max level)."""
    if level >= MAX_LEVEL:
        return None
    return LEVEL_THRESHOLDS[level + 1] - LEVEL_THRESHOLDS[level]
