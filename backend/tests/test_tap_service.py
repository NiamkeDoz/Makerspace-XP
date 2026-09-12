from datetime import datetime, timedelta

from app.models import Member, MemberBadge, Visit
from app.schemas import TapIn
from app.services.tap_service import record_tap

TAG = "tag-test"
READER = "door-1"


def dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso)


def tap(db, tag_id=TAG, reader_id=READER, timestamp=None, name=None):
    return record_tap(db, TapIn(tag_id=tag_id, reader_id=reader_id, timestamp=timestamp, name=name))


# --- Enrollment / unknown tag ---


def test_unknown_tag_without_name_returns_unknown_status(db):
    result = tap(db, timestamp=dt("2026-01-05T10:00:00"))
    assert result.status == "unknown_tag"
    assert result.member_id is None
    assert db.query(Member).count() == 0


def test_unknown_tag_with_name_enrolls_and_records_first_tap(db):
    result = tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    assert result.status == "enrolled"
    assert result.name == "Jamie"
    assert result.points_awarded == 10
    assert result.current_streak == 1
    assert result.current_weekly_streak == 1

    member = db.query(Member).filter(Member.tag_id == TAG).one()
    assert member.name == "Jamie"
    assert member.points_balance == 10


# --- Check-in / check-out toggle ---


def test_second_tap_same_day_checks_out(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    result = tap(db, timestamp=dt("2026-01-05T11:00:00"))
    assert result.status == "checked_out"
    assert result.points_awarded == 0

    open_visits = db.query(Visit).filter(Visit.check_out.is_(None)).count()
    assert open_visits == 0


def test_checkout_awards_no_points_or_xp(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    result = tap(db, timestamp=dt("2026-01-05T11:00:00"))
    assert result.points_awarded == 0
    assert result.xp_awarded == 0
    assert result.badges_awarded == []


def test_third_tap_same_day_checks_in_again(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    tap(db, timestamp=dt("2026-01-05T11:00:00"))  # check-out
    result = tap(db, timestamp=dt("2026-01-05T12:00:00"))  # check-in again, same day
    assert result.status == "duplicate"  # no extra points/XP - already earned today
    assert result.points_awarded == 0

    # but it still opened a new visit (occupancy/total_visits tracking)
    total_visits = db.query(Visit).filter(Visit.member_id == result.member_id).count()
    assert total_visits == 2


def test_next_day_checkin_is_recorded_not_duplicate(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    tap(db, timestamp=dt("2026-01-05T11:00:00"))  # check-out
    result = tap(db, timestamp=dt("2026-01-06T10:00:00"))
    assert result.status == "recorded"
    assert result.points_awarded == 10
    assert result.current_streak == 2


# --- Attendance badges ---


def test_attendance_badge_awarded_at_visit_threshold(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")  # visit 1 -> First Spark
    tap(db, timestamp=dt("2026-01-05T11:00:00"))
    tap(db, timestamp=dt("2026-01-06T10:00:00"))  # visit 2
    tap(db, timestamp=dt("2026-01-06T11:00:00"))
    tap(db, timestamp=dt("2026-01-07T10:00:00"))  # visit 3
    tap(db, timestamp=dt("2026-01-07T11:00:00"))
    tap(db, timestamp=dt("2026-01-08T10:00:00"))  # visit 4
    tap(db, timestamp=dt("2026-01-08T11:00:00"))
    result = tap(db, timestamp=dt("2026-01-09T10:00:00"))  # visit 5 -> Getting Wired

    assert [b.name for b in result.badges_awarded] == ["Getting Wired"]

    member = db.query(Member).filter(Member.tag_id == TAG).one()
    persisted = db.query(MemberBadge).filter(MemberBadge.member_id == member.id, MemberBadge.badge_type == "attendance").all()
    assert {b.name for b in persisted} == {"First Spark", "Getting Wired"}


def test_attendance_badge_not_reawarded_on_later_taps(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")  # First Spark
    tap(db, timestamp=dt("2026-01-05T11:00:00"))
    result = tap(db, timestamp=dt("2026-01-06T10:00:00"))  # visit 2, no new badge yet
    assert result.badges_awarded == []


# --- Daily streak badges ---


def test_streak_badge_awarded_at_seven_days(db):
    start = dt("2026-01-05T10:00:00")  # a Monday
    tap(db, timestamp=start, name="Jamie")
    tap(db, timestamp=start + timedelta(hours=1))
    for day in range(1, 6):
        d = start + timedelta(days=day)
        tap(db, timestamp=d)
        tap(db, timestamp=d + timedelta(hours=1))
    result = tap(db, timestamp=start + timedelta(days=6))  # 7th consecutive day

    assert result.current_streak == 7
    assert "Momentum" in [b.name for b in result.badges_awarded]


def test_streak_resets_after_missed_day(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    tap(db, timestamp=dt("2026-01-05T11:00:00"))
    tap(db, timestamp=dt("2026-01-06T10:00:00"))  # day 2
    tap(db, timestamp=dt("2026-01-06T11:00:00"))
    result = tap(db, timestamp=dt("2026-01-08T10:00:00"))  # skipped the 7th -> reset
    assert result.current_streak == 1

    member = db.query(Member).filter(Member.tag_id == TAG).one()
    assert member.longest_streak == 2  # the record survives the reset


# --- Weekly streak ---


def test_weekly_streak_starts_at_one_on_enrollment(db):
    result = tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    assert result.current_weekly_streak == 1


def test_weekly_streak_unchanged_by_second_checkin_same_week(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")  # Monday, week 1
    tap(db, timestamp=dt("2026-01-05T11:00:00"))  # check-out
    result = tap(db, timestamp=dt("2026-01-07T10:00:00"))  # Wednesday, same week
    assert result.current_weekly_streak == 1


def test_weekly_streak_increments_on_consecutive_week(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")  # week of Jan 5
    tap(db, timestamp=dt("2026-01-05T11:00:00"))
    result = tap(db, timestamp=dt("2026-01-12T10:00:00"))  # week of Jan 12
    assert result.current_weekly_streak == 2


def test_weekly_streak_resets_after_skipped_week(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    tap(db, timestamp=dt("2026-01-05T11:00:00"))
    tap(db, timestamp=dt("2026-01-12T10:00:00"))  # week 2
    tap(db, timestamp=dt("2026-01-12T11:00:00"))
    result = tap(db, timestamp=dt("2026-01-26T10:00:00"))  # skipped week of Jan 19
    assert result.current_weekly_streak == 1

    member = db.query(Member).filter(Member.tag_id == TAG).one()
    assert member.longest_weekly_streak == 2  # record preserved despite reset


def test_weekly_streak_checkout_does_not_affect_streak(db):
    tap(db, timestamp=dt("2026-01-05T10:00:00"), name="Jamie")
    result = tap(db, timestamp=dt("2026-01-05T11:00:00"))  # check-out same day
    assert result.status == "checked_out"
    member = db.query(Member).filter(Member.tag_id == TAG).one()
    assert member.current_weekly_streak == 1


def test_weekly_streak_badge_awarded_at_four_weeks(db):
    weeks = ["2026-01-05", "2026-01-12", "2026-01-19", "2026-01-26"]
    result = None
    for i, week in enumerate(weeks):
        name = "Jamie" if i == 0 else None
        result = tap(db, timestamp=dt(f"{week}T10:00:00"), name=name)
        if i < len(weeks) - 1:
            tap(db, timestamp=dt(f"{week}T11:00:00"))  # check back out

    assert result.current_weekly_streak == 4
    assert "1-Month Streak" in [b.name for b in result.badges_awarded]


def test_weekly_streak_badge_not_double_awarded(db):
    """Reaching the same weekly-streak threshold twice (after a reset) shouldn't re-award it."""
    member_id = None
    # Build to a 4-week streak, dip, then rebuild to 4 again.
    for week in ["2026-01-05", "2026-01-12", "2026-01-19", "2026-01-26"]:
        name = "Jamie" if week == "2026-01-05" else None
        result = tap(db, timestamp=dt(f"{week}T10:00:00"), name=name)
        member_id = result.member_id
        tap(db, timestamp=dt(f"{week}T11:00:00"))

    first_award_count = db.query(MemberBadge).filter(
        MemberBadge.member_id == member_id, MemberBadge.badge_type == "weekly_streak"
    ).count()
    assert first_award_count == 1

    # Skip weeks, then rebuild another 4-week run.
    for week in ["2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23"]:
        tap(db, timestamp=dt(f"{week}T10:00:00"))
        tap(db, timestamp=dt(f"{week}T11:00:00"))

    second_award_count = db.query(MemberBadge).filter(
        MemberBadge.member_id == member_id, MemberBadge.badge_type == "weekly_streak"
    ).count()
    assert second_award_count == 1  # still just the one "1-Month Streak" badge, not re-awarded
