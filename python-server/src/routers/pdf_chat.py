"""PDF Chat router — upload, query & image-serving endpoints."""

from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from src.config import UPLOAD_DIR, EXTRACTED_IMAGES_DIR, ALLOWED_EXTENSIONS
from src.models.pdf_chat import ImageInfo, QueryRequest, QueryResponse, UploadResponse
from src.services.pdf_chat.processor import ImageMeta, process_pdfs_parallel
from src.services.pdf_chat.rag_service import initialise_rag, query_rag, session
from src.utils.image import encode_image

router = APIRouter(prefix="/api/pdf-chat", tags=["pdf-chat"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _secure(filename: str) -> str:
    """Minimal secure-filename: strip path separators, whitespace."""
    return os.path.basename(filename).strip().replace(" ", "_")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: list[UploadFile] = File(...)):
    """Accept PDF / image uploads and build the RAG pipeline."""
    if not files:
        raise HTTPException(400, "No files provided")

    pdf_paths: list[str] = []
    image_metas: list[ImageMeta] = []

    for f in files:
        if not f.filename or not _allowed(f.filename):
            continue
        safe_name = _secure(f.filename)
        dest = os.path.join(UPLOAD_DIR, safe_name)
        content = await f.read()
        with open(dest, "wb") as out:
            out.write(content)

        if safe_name.lower().endswith(".pdf"):
            pdf_paths.append(dest)
        else:
            image_metas.append(
                ImageMeta(
                    path=dest,
                    filename=safe_name,
                    pdf_source="uploaded_image",
                    page_number=1,
                    image_index=1,
                    base64=encode_image(dest),
                    type="image",
                )
            )

    # Parallel PDF processing
    texts: list[str] = []
    extracted_images: list[ImageMeta] = []
    if pdf_paths:
        texts, extracted_images = process_pdfs_parallel(pdf_paths, EXTRACTED_IMAGES_DIR)

    all_images = image_metas + extracted_images

    # Build RAG
    initialise_rag(texts, [], all_images)

    images_info = [
        ImageInfo(
            filename=m["filename"],
            pdf_source=m["pdf_source"],
            page_number=m["page_number"],
            image_index=m["image_index"],
            preview_url=f"/api/pdf-chat/images/{os.path.basename(m['path'])}",
        )
        for m in all_images
    ]

    return UploadResponse(
        message=f"Processed {len(pdf_paths)} PDFs and {len(image_metas)} images",
        text_chunks=len(texts),
        images_uploaded=len(image_metas),
        images_extracted_from_pdf=len(extracted_images),
        total_images=len(all_images),
        images=images_info,
    )


@router.post("/query", response_model=QueryResponse)
async def query(body: QueryRequest):
    """Run a question through the multi-modal RAG chain."""
    if not session.ready:
        raise HTTPException(400, "Upload documents first.")
    if not body.query.strip():
        raise HTTPException(400, "Query must not be empty.")

    try:
        result = query_rag(body.query)
    except RuntimeError as exc:
        raise HTTPException(400, str(exc))
    except Exception as exc:
        raise HTTPException(500, str(exc))

    return QueryResponse(**result)


@router.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve an extracted / uploaded image file."""
    for directory in (EXTRACTED_IMAGES_DIR, UPLOAD_DIR):
        path = os.path.join(directory, filename)
        if os.path.isfile(path):
            return FileResponse(path, media_type="image/png")
    raise HTTPException(404, "Image not found")


@router.get("/health")
async def health():
    return {"status": "healthy", "rag_ready": session.ready}
