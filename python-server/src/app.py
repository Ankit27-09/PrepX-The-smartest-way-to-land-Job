"""FastAPI application factory."""

import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Feature routers (add new features here) ──────────────────────────────────
from src.routers.pdf_chat import router as pdf_chat_router
from src.routers.ai_tutor import router as ai_tutor_router
from src.routers.jobs import router as jobs_router
from src.routers.interview import interview_router, livekit_router, results_router, code_router
from app.career.router import router as career_router


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    app = FastAPI(title="AI Learning API", version="1.0.0")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global error handler
    @app.exception_handler(Exception)
    async def global_exception_handler(_request: Request, exc: Exception):
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(exc)})

    # ── Register routers ─────────────────────────────────────────────────
    app.include_router(pdf_chat_router)
    app.include_router(career_router)
    app.include_router(ai_tutor_router)
    app.include_router(jobs_router, prefix="/api", tags=["jobs"])
    app.include_router(interview_router)
    app.include_router(livekit_router)
    app.include_router(results_router)
    app.include_router(code_router)

    @app.get("/")
    async def root():
        return {"message": "AI Learning API is running"}

    return app
