"""PDF text extraction service for interviews."""

import fitz


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text content from a PDF file."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text_parts = []

    for page in doc:
        text = page.get_text()
        if text.strip():
            text_parts.append(text.strip())

    doc.close()

    full_text = "\n\n".join(text_parts)

    if not full_text.strip():
        raise ValueError("Could not extract any text from the PDF. The file may be image-based or empty.")

    return full_text
