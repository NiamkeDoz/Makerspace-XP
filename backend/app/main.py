from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, leaderboard, members, occupancy, taps, wheel

app = FastAPI(
    title="Makerspace XP",
    description=(
        "Attendance, points, streaks, and XP/leveling for the makerspace. "
        "POST /taps is the core endpoint — attendance, enrollment, points, XP, and "
        "check-in/check-out presence tracking all flow through it. Endpoints under "
        "/admin require an X-Admin-Token header; everything else is open on the LAN."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(taps.router)
app.include_router(members.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)
app.include_router(occupancy.router)
app.include_router(wheel.router)


@app.get("/health", summary="Liveness check", tags=["health"])
def health():
    """Trivial check used by the frontend to show the API online/unreachable indicator."""
    return {"status": "ok"}
