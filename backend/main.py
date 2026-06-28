from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os
from database import init_db, get_db, client
from routers import auth, reports, users, analytics, notifications, ai
from config import UPLOAD_DIR, DATABASE_NAME

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    yield
    client.close()
    logger.info("Shutting down...")


app = FastAPI(
    title="RoadVision API",
    description="AI-powered road damage detection and reporting system backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.dirname(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {
        "message": "RoadVision API Running",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    mongo_ok = False
    error = None
    try:
        await client.admin.command("ping")
        mongo_ok = True
    except Exception as e:
        error = str(e)

    return {
        "api": "ok",
        "mongodb": "connected" if mongo_ok else "disconnected",
        "database": DATABASE_NAME,
        "error": error,
    }
