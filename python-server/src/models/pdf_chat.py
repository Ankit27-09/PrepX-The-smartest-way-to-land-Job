"""Pydantic request / response schemas for the PDF Chat feature."""

from pydantic import BaseModel


# ── Request ───────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str


# ── Response ──────────────────────────────────────────────────────────────────

class ImageInfo(BaseModel):
    filename: str
    pdf_source: str
    page_number: int
    image_index: int
    preview_url: str


class UploadResponse(BaseModel):
    message: str
    text_chunks: int
    images_uploaded: int
    images_extracted_from_pdf: int
    total_images: int
    images: list[ImageInfo]


class QueryImageInfo(BaseModel):
    filename: str
    pdf_source: str
    page_number: int
    image_index: int
    preview_url: str
    base64_preview: str


class QueryResponse(BaseModel):
    answer: str
    relevant_docs_count: int
    relevant_images: list[QueryImageInfo]
