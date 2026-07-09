"""
Document data model.

Defines the structure for a loaded document with
metadata and full text content.
"""

from pydantic import BaseModel, Field
from datetime import datetime, timezone


class Document(BaseModel):
    """
    Represents a single legal contract document loaded from disk.

    This model is the standardized output of the DocumentLoader
    and serves as the input for the chunking phase.
    """

    id: str = Field(description="Unique identifier for the document")
    filename: str = Field(description="Original filename with extension")
    relative_path: str = Field(description="Relative path from the dataset contracts directory")
    dataset_name: str = Field(description="Name of the source dataset (e.g. CUAD)")
    partition: str = Field(description="Dataset partition (Part_I, Part_II, Part_III)")
    file_size: int = Field(ge=0, description="File size in bytes")
    load_timestamp: str = Field(description="ISO 8601 timestamp of when the document was loaded")
    content: str = Field(description="Full raw text content of the document")
    document_id: str | None = Field(default=None, description="UUID assigned on upload (used for multi-document filtering)")

    class Config:
        frozen = True
