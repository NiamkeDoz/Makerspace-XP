from datetime import date, datetime, timezone

from app.models import Member
from app.routers.admin import adjust_member
from app.schemas import AdminAdjustIn


def make_member(db, **overrides) -> Member:
    member = Member(tag_id="tag-test", name="Jamie", **overrides)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


# --- member_since correction ---


def test_member_since_updates_created_at_to_midnight_utc(db):
    member = make_member(db, created_at=datetime(2026, 4, 26, 15, 59, 54, tzinfo=timezone.utc))

    adjust_member(member.id, AdminAdjustIn(member_since=date(2025, 1, 15)), db)

    db.refresh(member)
    assert member.created_at == datetime(2025, 1, 15, 0, 0, 0)


def test_member_since_omitted_leaves_created_at_unchanged(db):
    # SQLite strips tzinfo on round-trip, so store naive to match what's read back.
    original = datetime(2026, 4, 26, 15, 59, 54)
    member = make_member(db, created_at=original)

    adjust_member(member.id, AdminAdjustIn(name="Jamie Updated"), db)

    db.refresh(member)
    assert member.created_at == original
    assert member.name == "Jamie Updated"


def test_member_since_can_be_backdated_before_original_enrollment(db):
    # e.g. someone who attended before getting a tag, corrected after the fact
    member = make_member(db, created_at=datetime(2026, 6, 1, tzinfo=timezone.utc))

    adjust_member(member.id, AdminAdjustIn(member_since=date(2024, 3, 1)), db)

    db.refresh(member)
    assert member.created_at == datetime(2024, 3, 1, 0, 0, 0)


def test_member_since_updates_alongside_other_fields_in_same_request(db):
    member = make_member(db, created_at=datetime(2026, 4, 26, tzinfo=timezone.utc), points_balance=10)

    adjust_member(
        member.id,
        AdminAdjustIn(member_since=date(2025, 12, 25), points_balance=500),
        db,
    )

    db.refresh(member)
    assert member.created_at == datetime(2025, 12, 25, 0, 0, 0)
    assert member.points_balance == 500
