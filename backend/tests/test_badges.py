from app.badges import newly_crossed, next_threshold

THRESHOLDS = [(1, "One"), (5, "Five"), (10, "Ten")]


def test_next_threshold_returns_first_unmet():
    assert next_threshold(THRESHOLDS, 3) == {"threshold": 5, "name": "Five", "remaining": 2}


def test_next_threshold_none_when_all_met():
    assert next_threshold(THRESHOLDS, 10) is None


def test_next_threshold_at_max_level_style_boundary():
    # exactly meeting the highest threshold means nothing remains unmet
    assert next_threshold(THRESHOLDS, 999) is None


def test_newly_crossed_single_threshold():
    assert newly_crossed(THRESHOLDS, before=0, after=3) == [(1, "One")]


def test_newly_crossed_multiple_thresholds_in_one_jump():
    # e.g. several visits recorded in one backfill/burst
    assert newly_crossed(THRESHOLDS, before=0, after=10) == [(1, "One"), (5, "Five"), (10, "Ten")]


def test_newly_crossed_nothing_when_already_met():
    assert newly_crossed(THRESHOLDS, before=5, after=7) == []


def test_newly_crossed_nothing_on_decrease():
    # streak resets should never retroactively "un-cross" or re-report a threshold
    assert newly_crossed(THRESHOLDS, before=10, after=1) == []


def test_newly_crossed_boundary_is_inclusive_of_after():
    assert newly_crossed(THRESHOLDS, before=4, after=5) == [(5, "Five")]
