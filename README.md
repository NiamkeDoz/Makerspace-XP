# Makerspace XP

NFC-based attendance tracking for the makerspace, expanded into a points/streak/XP rewards platform.

Full design notes: see the Obsidian vault under `Leisure/Macon MakeWell/Arduino Club/NFC Access Card`.

## Stack
- ESP32 + PN532 NFC reader → FastAPI backend (HTTP POST)
- Postgres
- React (Vite + TypeScript + Tailwind) frontend
- Docker Compose for local/LAN deployment

## Status: Attendance MVP

Implemented so far:
- `members` / `taps` tables (Alembic-managed)
- `POST /taps` — records a tap, dedupes per day per member, computes streak + points via a config-driven rules table (`backend/app/rules.py`)
- `GET /members/{id}`, `GET /leaderboard`
- `/admin/members` (list, enroll, adjust points/streak) — token-protected, see Admin panel below
- `GET /health`
- React frontend: leaderboard, member lookup, admin panel — all wired to live API data

Not yet built: enrollment flow for unknown tags at tap-time (kiosk-side), kiosk websocket, XP/leveling, badges, ESP32 firmware.

## Running locally

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose up -d --build
docker compose exec api alembic upgrade head
```

- API: `http://localhost:8000` — interactive docs at `/docs` (Swagger) or `/redoc`; narrative API reference is in the Obsidian vault (`Arduino Club/Makespace-XP/api-reference.md`)
- Frontend: `http://localhost:5174` (mapped off Vite's default 5173, which may be in use by another local project)
- Postgres exposed on `5432` for local inspection.

### Admin panel

Visit the frontend and unlock the "Admin" section with `ADMIN_TOKEN` (from `.env`, defaults to `changeme` — change this before real use). From there you can enroll members by tag ID and adjust points/streaks by hand.

### Seeding test data

```bash
docker compose exec -T db psql -U makerspace -d makerspace_xp < backend/seed_data.sql
```

Wipes existing members/taps and inserts 8 sample members with varied points, streaks, and tap history for testing the leaderboard/dashboard against realistic data.

### Running tests

```bash
docker compose exec api pytest -v
```

Backend unit/integration tests live in `backend/tests/`, run against an in-memory SQLite DB (not the dev Postgres container) via a `db` fixture in `conftest.py`. They call `record_tap()` directly rather than going through HTTP, exercising check-in/check-out toggling, all three badge categories (attendance, daily streak, weekly streak), and threshold-crossing/no-double-award logic in `app/badges.py`.

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
