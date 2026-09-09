from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import taps

app = FastAPI(title="Makerspace XP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(taps.router)


@app.get("/health")
def health():
    return {"status": "ok"}
