"""
Application configuration management.

Loads environment variables and provides typed settings
using Pydantic's BaseSettings. All config values are
centrally managed here for easy maintenance.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Values can be overridden via a .env file.
    """

    # Application metadata
    APP_NAME: str = "Legal Contract Q&A Assistant"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Dataset
    CUAD_DATASET_PATH: str = "data/CUAD"

    # Vector store
    FAISS_INDEX_PATH: str = "app/vectorstore/faiss_index"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


settings = Settings()