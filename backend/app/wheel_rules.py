"""Config-driven prize table for the Spin the Wheel feature, retunable without a
migration — same philosophy as rules.py's streak multipliers and badges.py's thresholds.

Prizes are XP-only for the first version (points_balance / leaderboard rank untouched —
the wheel is a separate reward channel from tap-in earning, not a way to climb ranks
faster). More prize types (points, cosmetic-only, etc.) can join this table later.

Modeled after a physical prize wheel (Price Is Right style): every wedge is the same
size, so weight is a flat 1 for all of them — odds are purely "how many of the 25 wedges
say this." XP values run 5-100 in steps of 5, with "Better luck next time" wedges
interspersed rather than grouped, same as they'd be laid out on a real wheel.
"""

# (weight, xp_amount, label) — all weights equal (1); segment order here is wedge order.
WHEEL_PRIZES: list[tuple[int, int, str]] = [
    (1, 5, "5 XP"),
    (1, 10, "10 XP"),
    (1, 15, "15 XP"),
    (1, 20, "20 XP"),
    (1, 0, "Better luck next time"),
    (1, 25, "25 XP"),
    (1, 30, "30 XP"),
    (1, 35, "35 XP"),
    (1, 40, "40 XP"),
    (1, 0, "Better luck next time"),
    (1, 45, "45 XP"),
    (1, 50, "50 XP"),
    (1, 55, "55 XP"),
    (1, 60, "60 XP"),
    (1, 0, "Better luck next time"),
    (1, 65, "65 XP"),
    (1, 70, "70 XP"),
    (1, 75, "75 XP"),
    (1, 80, "80 XP"),
    (1, 0, "Better luck next time"),
    (1, 85, "85 XP"),
    (1, 90, "90 XP"),
    (1, 95, "95 XP"),
    (1, 100, "100 XP"),
    (1, 0, "Better luck next time"),
]
