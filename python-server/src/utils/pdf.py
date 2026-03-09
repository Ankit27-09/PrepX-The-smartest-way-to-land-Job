"""PDF text extraction using PyMuPDF (fitz)."""

from typing import Optional
import fitz  # PyMuPDF


class DocumentAIService:
    """Extracts text from PDF bytes using PyMuPDF."""

    async def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text())
        doc.close()
        return "\n".join(pages)


_doc_service: Optional[DocumentAIService] = None


def get_document_ai_service() -> DocumentAIService:
    global _doc_service
    if _doc_service is None:
        _doc_service = DocumentAIService()
    return _doc_service
