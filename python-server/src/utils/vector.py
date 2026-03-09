"""Vector service — thin wrapper re-exported for scoring agent compatibility."""

from typing import Optional


class VectorService:
    """Placeholder vector service used by the scoring agent."""
    pass


_vector_service: Optional[VectorService] = None


def get_vector_service() -> VectorService:
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
