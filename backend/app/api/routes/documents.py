"""
Document management endpoints.

Provides authenticated listing and deletion of uploaded documents
backed by Supabase Storage and the documents table.
"""

import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.services.document_db_service import DocumentDBService
from app.services.storage_service import StorageService
from app.services.faiss_index_service import FaissIndexService
from app.services.contract_analysis_service import ContractAnalysisService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentResponse(BaseModel):
    id: str = Field(description="Primary key UUID of the document record")
    document_id: str = Field(description="UUID used for FAISS multi-document retrieval")
    filename: str = Field(description="Original filename")
    storage_path: str = Field(description="Path in the contracts bucket")
    file_size: int = Field(description="File size in bytes")
    indexed: bool = Field(description="Whether the document has been indexed")
    uploaded_at: str = Field(description="ISO 8601 upload timestamp")


@router.get("", response_model=list[DocumentResponse])
async def list_documents(user_id: str = Depends(get_current_user)) -> list[DocumentResponse]:
    """
    Return all documents belonging to the authenticated user.

    Results are ordered by upload date descending.
    """
    db = DocumentDBService()
    docs = db.get_user_documents(user_id)
    return [
        DocumentResponse(
            id=doc["id"],
            document_id=doc["document_id"],
            filename=doc["filename"],
            storage_path=doc["storage_path"],
            file_size=doc["file_size"],
            indexed=doc["indexed"],
            uploaded_at=doc["uploaded_at"],
        )
        for doc in docs
    ]


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user),
) -> None:
    """
    Delete a document by its primary key UUID.

    Verifies ownership, deletes the file from Supabase Storage,
    then removes the row from the documents table.
    """
    db = DocumentDBService()

    doc = db.get_document(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc["user_id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this document.",
        )

    try:
        storage = StorageService()
        storage.delete_file(doc["storage_path"])
    except Exception as e:
        logger.error(
            "Failed to delete file from storage: path=%s, error=%s\n%s",
            doc["storage_path"],
            e,
            traceback.format_exc(),
        )

    db.delete_document(document_id)


class HealthResponse(BaseModel):
    health_score: float = Field(description="Contract health score from 0.0 to 10.0")
    risk_level: str = Field(description="One of: Low, Medium, High, Critical")
    present_clauses: list[str] = Field(default_factory=list, description="Clauses detected in the document")
    missing_clauses: list[str] = Field(default_factory=list, description="Important clauses not found")
    recommendations: list[str] = Field(default_factory=list, description="Suggestions based on missing clauses")


@router.get("/{document_id}/health", response_model=HealthResponse)
async def document_health(document_id: str) -> HealthResponse:
    """
    Analyze a document's clause coverage and return a health assessment.

    Retrieves the document's chunk texts from the vector index, runs
    keyword-based clause detection, computes a health score, and
    generates recommendations for missing clauses.
    """
    try:
        idx_service = FaissIndexService.load()
    except FileNotFoundError:
        return HealthResponse(
            health_score=0.0,
            risk_level="Critical",
            present_clauses=[],
            missing_clauses=list(ContractAnalysisService.CLAUSE_PATTERNS.keys()),
            recommendations=[],
        )

    chunks = idx_service.get_chunks_by_document_id(document_id)

    if not chunks:
        return HealthResponse(
            health_score=0.0,
            risk_level="Critical",
            present_clauses=[],
            missing_clauses=list(ContractAnalysisService.CLAUSE_PATTERNS.keys()),
            recommendations=[],
        )

    analyzer = ContractAnalysisService()
    result = analyzer.analyze(chunks)

    return HealthResponse(**result)
