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

    # Chunking
    CHUNK_SIZE: int = 1500
    CHUNK_OVERLAP: int = 300

    # Embeddings
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_BATCH_SIZE: int = 32

    # Vector store
    FAISS_INDEX_PATH: str = "app/vectorstore/faiss_index"
    FAISS_METADATA_PATH: str = "app/vectorstore/faiss_metadata.pkl"

    # Retrieval
    RETRIEVAL_TOP_K: int = 5

    # RAG / LLM Generation
    GEMINI_TEMPERATURE: float = 0.3
    GEMINI_MAX_TOKENS: int = 1024

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


settings = Settings()