"""PDF Chat services — extraction and RAG pipeline."""

from src.services.pdf_chat.processor import (
    ImageMeta,
    extract_images_from_pdf,
    process_pdfs_parallel,
)
from src.services.pdf_chat.rag_service import initialise_rag, query_rag, session

__all__ = [
    "ImageMeta",
    "extract_images_from_pdf",
    "process_pdfs_parallel",
    "initialise_rag",
    "query_rag",
    "session",
]
