"""
FastAPI application entry point.

Initializes the FastAPI app, registers middleware (CORS),
includes API routers, and configures logging.
"""

import os

# macOS: suppress OMP Error #15 caused by duplicate libomp loads
# (FAISS + google-generativeai both load the OpenMP runtime).
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import health, chat, retrieval, upload, index as index_router

# Configure logging on startup
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Legal Contract Q&A Assistant",
)

# CORS middleware — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(retrieval.router)
app.include_router(upload.router)
app.include_router(index_router.router)


@app.on_event("startup")
async def startup_event():
    """Run actions on application startup."""
    logger.info("Application starting up...")


@app.on_event("shutdown")
async def shutdown_event():
    """Run actions on application shutdown."""
    logger.info("Application shutting down...")