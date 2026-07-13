"""
Supabase Storage service for uploading and deleting contract PDFs.

Files are stored under::

    contracts/users/<user_uuid>/<filename>

Supabase automatically creates the folder hierarchy on first upload.
No manual folder creation is performed.
"""

import logging

from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Manages file uploads and deletions in the Supabase contracts bucket."""

    def __init__(self) -> None:
        self._client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        self._bucket = settings.SUPABASE_STORAGE_BUCKET
        logger.debug("StorageService initialized: bucket=%s", self._bucket)

    def upload_file(self, user_id: str, filename: str, file_bytes: bytes) -> str:
        """
        Upload a file to the contracts bucket.

        The file is stored at ``users/<user_id>/<filename>``.
        Supabase creates intermediate folders automatically.

        Args:
            user_id: The Supabase user UUID.
            filename: The original filename (e.g. ``contract.pdf``).
            file_bytes: The raw file content.

        Returns:
            The storage path (e.g. ``users/<uuid>/contract.pdf``).

        Raises:
            Exception: If the upload fails.
        """
        storage_path = f"users/{user_id}/{filename}"
        logger.info("Uploading to Supabase Storage: bucket=%s, path=%s", self._bucket, storage_path)

        self._client.storage.from_(self._bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )

        logger.info("Upload to Supabase Storage succeeded: %s", storage_path)
        return storage_path

    def delete_file(self, storage_path: str) -> None:
        """
        Delete a file from the contracts bucket.

        Args:
            storage_path: The full storage path
                          (e.g. ``users/<uuid>/contract.pdf``).

        Raises:
            Exception: If the deletion fails.
        """
        logger.info("Deleting from Supabase Storage: bucket=%s, path=%s", self._bucket, storage_path)
        self._client.storage.from_(self._bucket).remove([storage_path])
        logger.info("Deleted from Supabase Storage: %s", storage_path)
