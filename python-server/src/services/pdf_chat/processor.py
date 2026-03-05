"""PDF text and image extraction helpers."""

from __future__ import annotations

import concurrent.futures
import io
import os
from typing import TypedDict

import fitz  # PyMuPDF
from PIL import Image
from langchain_community.document_loaders import PyPDFLoader

from src.utils.image import encode_image


class ImageMeta(TypedDict):
    path: str
    filename: str
    pdf_source: str
    page_number: int
    image_index: int
    base64: str
    type: str


def extract_images_from_pdf(pdf_path: str, output_dir: str) -> list[ImageMeta]:
    """Extract every embedded image from *pdf_path* using PyMuPDF."""
    os.makedirs(output_dir, exist_ok=True)
    images: list[ImageMeta] = []
    pdf_name = os.path.basename(pdf_path)

    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            for img_idx, img in enumerate(doc[page_num].get_images(full=True)):
                try:
                    base_image = doc.extract_image(img[0])
                    pil = Image.open(io.BytesIO(base_image["image"])).convert("RGB")

                    fname = f"{pdf_name}_page_{page_num + 1}_img_{img_idx + 1}.png"
                    out_path = os.path.join(output_dir, fname)
                    pil.save(out_path, "PNG")

                    images.append(
                        ImageMeta(
                            path=out_path,
                            filename=fname,
                            pdf_source=pdf_name,
                            page_number=page_num + 1,
                            image_index=img_idx + 1,
                            base64=encode_image(out_path),
                            type="image",
                        )
                    )
                except Exception as exc:
                    print(f"[pdf_chat.processor] image error p{page_num} i{img_idx}: {exc}")
        doc.close()
    except Exception as exc:
        print(f"[pdf_chat.processor] PDF open error: {exc}")

    return images


def _process_single_pdf(pdf_path: str, images_dir: str) -> tuple[list[str], list[ImageMeta]]:
    """Extract texts + images from one PDF (used inside thread pool)."""
    texts: list[str] = []
    images: list[ImageMeta] = []

    try:
        docs = PyPDFLoader(pdf_path).load()
        texts.extend(d.page_content for d in docs)
    except Exception as exc:
        print(f"[pdf_chat.processor] text extraction error: {exc}")

    try:
        images.extend(extract_images_from_pdf(pdf_path, images_dir))
    except Exception as exc:
        print(f"[pdf_chat.processor] image extraction error: {exc}")

    return texts, images


def process_pdfs_parallel(pdf_paths: list[str], images_dir: str) -> tuple[list[str], list[ImageMeta]]:
    """Process multiple PDFs in parallel, returning aggregated texts and image metadata."""
    all_texts: list[str] = []
    all_images: list[ImageMeta] = []

    workers = min(4, max(1, len(pdf_paths)))
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(_process_single_pdf, p, images_dir) for p in pdf_paths]
        for fut in concurrent.futures.as_completed(futures):
            try:
                texts, imgs = fut.result()
                all_texts.extend(texts)
                all_images.extend(imgs)
            except Exception as exc:
                print(f"[pdf_chat.processor] thread error: {exc}")

    return all_texts, all_images
