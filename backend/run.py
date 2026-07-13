"""
Development server entry point.

Run with: python run.py
"""

import os

# macOS: suppress OMP Error #15 caused by duplicate libomp loads
# (FAISS + google-generativeai both load the OpenMP runtime).
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import uvicorn

from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )