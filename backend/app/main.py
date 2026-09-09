from fastapi import FastAPI

from app.routers import taps

app = FastAPI(title="Makerspace XP")

app.include_router(taps.router)


@app.get("/health")
def health():
    return {"status": "ok"}
