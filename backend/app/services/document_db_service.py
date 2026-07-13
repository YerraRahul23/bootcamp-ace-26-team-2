"""
Documents database service.

Provides CRUD operations on the Supabase ``documents`` table
using the service role client (bypasses RLS for server-side
operations like storage path verification).
"""

import logging
from datetime import datetime, timezone

from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


class DocumentDBService:
    """Manages the ``documents`` table in Supabase."""

    def __init__(self) -> None:
        self._client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        self._table = "documents"
        logger.debug("DocumentDBService initialized: table=%s", self._table)

    def insert_document(
        self,
        document_id: str,
        user_id: str,
        filename: str,
        storage_path: str,
        file_size: int,
    ) -> dict:
        """
        Insert a new document record.

        Args:
            document_id: The UUID used for FAISS multi-document retrieval.
            user_id: The Supabase user UUID.
            filename: The original filename.
            storage_path: The storage path in the contracts bucket.
            file_size: File size in bytes.

        Returns:
            The inserted row as a dict.
        """
        row = {
            "document_id": document_id,
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "file_size": file_size,
            "indexed": True,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }

        result = self._client.table(self._table).insert(row).execute()
        inserted = result.data[0]
        logger.info(
            "Document inserted: id=%s, document_id=%s, user_id=%s, filename=%s",
            inserted["id"],
            document_id,
            user_id,
            filename,
        )
        return inserted

    def get_user_documents(self, user_id: str) -> list[dict]:
        """
        Return all documents belonging to a user, ordered by upload date
        descending.

        Args:
            user_id: The Supabase user UUID.

        Returns:
            List of document row dicts.
        """
        result = (
            self._client.table(self._table)
            .select("*")
            .eq("user_id", user_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        logger.debug("Retrieved %d documents for user %s", len(result.data), user_id)
        return result.data

    def get_document(self, document_id: str) -> dict | None:
        """
        Fetch a single document by its primary key UUID.

        Args:
            document_id: The document's primary key UUID.

        Returns:
            The document row dict, or None if not found.
        """
        result = (
            self._client.table(self._table)
            .select("*")
            .eq("id", document_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    def delete_document(self, document_id: str) -> None:
        """
        Delete a document record by its primary key UUID.

        Args:
            document_id: The document's primary key UUID.
        """
        self._client.table(self._table).delete().eq("id", document_id).execute()
        logger.info("Document deleted from database: id=%s", document_id)
