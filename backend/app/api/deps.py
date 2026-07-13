"""
Authentication dependencies for API routes.

Extracts and verifies Supabase JWT tokens from the
Authorization header, returning the authenticated user UUID.
"""

import logging

from fastapi import Header, HTTPException
from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_current_user(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency that extracts the authenticated user UUID
    from a Bearer JWT token in the Authorization header.

    Args:
        authorization: The full Authorization header value
                       (expected format: "Bearer <token>").

    Returns:
        The Supabase user UUID (str).

    Raises:
        HTTPException 401: If the token is missing, malformed, or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header. Expected 'Bearer <token>'.",
        )

    token = authorization[len("Bearer "):]

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is empty.",
        )

    try:
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id
        logger.debug("Authenticated user: %s", user_id)
        return user_id
    except Exception as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )
