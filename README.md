# Makerspace XP

NFC-based attendance tracking for the makerspace, expanded into a points/streak/XP rewards platform.

Full design notes: see the Obsidian vault under `Leisure/Macon MakeWell/Arduino Club/NFC Access Card`.

## Stack
- ESP32 + PN532 NFC reader → FastAPI backend (HTTP POST)
- Postgres
- Docker Compose for local/LAN deployment

## Status: Attendance MVP

Implemented so far:
- `members` / `taps` tables (Alembic-managed)
- `POST /taps` — records a tap, dedupes per day per member, computes streak + points via a config-driven rules table (`backend/app/rules.py`)
- `GET /health`

Not yet built: enrollment flow for unknown tags, kiosk websocket, badges, member web app, ESP32 firmware.

## Running locally

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api alembic upgrade head
```

API available at `http://localhost:8000`. Postgres exposed on `5432` for local inspection.

### Enrolling a member manually (no enrollment endpoint yet)

```bash
docker compose exec db psql -U makerspace -d makerspace_xp \
  -c "INSERT INTO members (tag_id, name, points_balance, current_streak, longest_streak) VALUES ('<tag_id>', '<name>', 0, 0, 0);"
```

### Creating a new migration

```bash
docker compose exec api alembic revision --autogenerate -m "message"
docker compose exec api alembic upgrade head
```

## Build order

1. Attendance-only MVP ✅
2. Points/streak logic in TapService ✅
3. Enrollment flow
4. Kiosk websocket + display
5. Badges + `member_since` backfill tooling
6. Member web app (dashboard, leaderboard)
7. Hosting/auth
8. Hardening
