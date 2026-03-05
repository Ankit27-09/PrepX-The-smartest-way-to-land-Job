"""Multi-modal RAG pipeline — summarisation, vector store and chain."""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass, field

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.stores import InMemoryStore
from langchain_classic.retrievers.multi_vector import MultiVectorRetriever  # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from src.services.pdf_chat.processor import ImageMeta
from src.utils.image import is_image_data, looks_like_base64, resize_base64_image

# ── Models ────────────────────────────────────────────────────────────────────

_SUMMARISE_MODEL = "gemini-2.5-flash"
_VISION_MODEL = "gemini-2.5-flash"
_EMBEDDING_MODEL = "models/gemini-embedding-001"


# ── Text summarisation ────────────────────────────────────────────────────────

_TEXT_SUMMARY_PROMPT = (
    "You are an assistant tasked with summarizing tables and text for retrieval. "
    "These summaries will be embedded and used to retrieve the raw text or table elements. "
    "Give a concise summary of the table or text that is well optimized for retrieval. "
    "Table or text: {element}"
)


def generate_text_summaries(
    texts: list[str],
    tables: list[str] | None = None,
    summarize_texts: bool = False,
) -> tuple[list[str], list[str]]:
    """Return (text_summaries, table_summaries)."""
    prompt = PromptTemplate.from_template(_TEXT_SUMMARY_PROMPT)
    model = ChatGoogleGenerativeAI(temperature=0, model=_SUMMARISE_MODEL, max_output_tokens=1024)
    chain = {"element": lambda x: x} | prompt | model | StrOutputParser()

    text_summaries: list[str] = []
    table_summaries: list[str] = []

    if texts and summarize_texts:
        concurrency = min(4, max(1, len(texts)))
        try:
            text_summaries = chain.batch(texts, {"max_concurrency": concurrency})
        except Exception:
            text_summaries = chain.batch(texts, {"max_concurrency": 1})
    elif texts:
        text_summaries = list(texts)

    if tables:
        table_summaries = chain.batch(tables, {"max_concurrency": 1})

    return text_summaries, table_summaries


# ── Image summarisation ──────────────────────────────────────────────────────

_IMAGE_SUMMARY_PROMPT = (
    "You are an assistant tasked with summarizing images for retrieval. "
    "These summaries will be embedded and used to retrieve the raw image. "
    "Give a concise summary of the image that is well optimized for retrieval. "
    "Include any visible text, figure numbers, chart types, or key visual elements."
)


def _summarise_one_image(b64: str) -> str:
    model = ChatGoogleGenerativeAI(model=_VISION_MODEL, max_output_tokens=1024)
    msg = model.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": _IMAGE_SUMMARY_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                ]
            )
        ]
    )
    return str(msg.content)


def generate_image_summaries(
    metadata_list: list[ImageMeta],
) -> tuple[list[str], list[str]]:
    """Return (base64_list, summary_list) – kept in sync even on error."""
    bases: list[str] = []
    summaries: list[str] = []

    for meta in metadata_list:
        b64 = meta.get("base64", "")
        if not b64:
            continue
        try:
            summary = _summarise_one_image(b64)
        except Exception as exc:
            print(f"[pdf_chat.rag] image summary fallback for {meta['filename']}: {exc}")
            summary = (
                f"Image from {meta.get('pdf_source', '?')} "
                f"page {meta.get('page_number', '?')}, "
                f"figure {meta.get('image_index', '?')}"
            )
        bases.append(b64)
        summaries.append(summary)

    return bases, summaries


# ── Multi-vector retriever ───────────────────────────────────────────────────

def _build_retriever(
    text_summaries: list[str],
    texts: list[str],
    table_summaries: list[str],
    tables: list[str],
    image_summaries: list[str],
    images_b64: list[str],
    image_metadata: list[ImageMeta],
) -> MultiVectorRetriever:
    vectorstore = Chroma(
        collection_name="mm_rag_app",
        embedding_function=GoogleGenerativeAIEmbeddings(model=_EMBEDDING_MODEL),
    )
    store = InMemoryStore()
    id_key = "doc_id"

    retriever = MultiVectorRetriever(vectorstore=vectorstore, docstore=store, id_key=id_key)

    def _add(summaries: list[str], contents: list[str], doc_type: str, meta_list: list[dict] | None = None):
        ids = [str(uuid.uuid4()) for _ in contents]
        docs = []
        for i, s in enumerate(summaries):
            md = {id_key: ids[i], "type": doc_type}
            if meta_list and i < len(meta_list):
                md.update(meta_list[i])
            docs.append(Document(page_content=s, metadata=md))
        retriever.vectorstore.add_documents(docs)
        store_items = [
            json.dumps({"content": c, "type": doc_type, "metadata": (meta_list[i] if meta_list and i < len(meta_list) else {})})
            for i, c in enumerate(contents)
        ]
        retriever.docstore.mset(list(zip(ids, store_items)))

    if text_summaries:
        _add(text_summaries, texts, "text", [{"index": i, "content_type": "text"} for i in range(len(texts))])
    if table_summaries:
        _add(table_summaries, tables, "table", [{"index": i, "content_type": "table"} for i in range(len(tables))])
    if image_summaries:
        img_meta = [
            {"filename": m["filename"], "pdf_source": m["pdf_source"], "page_number": m["page_number"], "image_index": m["image_index"], "content_type": "image"}
            for m in image_metadata
        ]
        _add(image_summaries, images_b64, "image", img_meta)

    return retriever


# ── RAG chain helpers ────────────────────────────────────────────────────────

def _split_image_text(docs: list) -> dict[str, list[str]]:
    images: list[str] = []
    texts: list[str] = []
    for doc in docs:
        raw = doc.page_content if isinstance(doc, Document) else str(doc)
        try:
            parsed = json.loads(raw)
            content = parsed.get("content", raw)
        except (json.JSONDecodeError, TypeError):
            content = raw
        if looks_like_base64(content) and is_image_data(content):
            images.append(resize_base64_image(content))
        else:
            texts.append(content)
    return {"images": images, "texts": texts}


def _build_prompt(data: dict) -> list[HumanMessage]:
    text_block = "\n".join(data["context"]["texts"])
    parts: list[dict] = [
        {
            "type": "text",
            "text": (
                "You are a helpful assistant answering questions based on provided content.\n"
                "You will receive text, tables, and images (charts / graphs).\n"
                f"Question: {data['question']}\n\nText and/or tables:\n{text_block}"
            ),
        }
    ]
    for img in data["context"]["images"]:
        parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}})
    return [HumanMessage(content=parts)]


def _build_chain(retriever: MultiVectorRetriever):
    model = ChatGoogleGenerativeAI(temperature=0, model=_VISION_MODEL, max_output_tokens=1024)
    return (
        {"context": retriever | RunnableLambda(_split_image_text), "question": RunnablePassthrough()}
        | RunnableLambda(_build_prompt)
        | model
        | StrOutputParser()
    )


# ── Session state ────────────────────────────────────────────────────────────

@dataclass
class RAGSession:
    retriever: MultiVectorRetriever | None = None
    chain: object | None = None
    image_metadata: list[ImageMeta] = field(default_factory=list)

    @property
    def ready(self) -> bool:
        return self.chain is not None


# Singleton session
session = RAGSession()


def initialise_rag(
    texts: list[str],
    tables: list[str],
    image_metadata: list[ImageMeta],
) -> dict:
    """Build the full RAG pipeline and store in the module-level session."""
    img_b64, img_summaries = generate_image_summaries(image_metadata)
    text_summaries, table_summaries = generate_text_summaries(texts, tables, summarize_texts=True)

    retriever = _build_retriever(
        text_summaries, texts, table_summaries, tables, img_summaries, img_b64, image_metadata
    )
    chain = _build_chain(retriever)

    session.retriever = retriever
    session.chain = chain
    session.image_metadata = list(image_metadata)

    return {
        "text_summaries": len(text_summaries),
        "table_summaries": len(table_summaries),
        "image_summaries": len(img_summaries),
    }


def query_rag(question: str) -> dict:
    """Run a question through the RAG chain, returning answer + relevant images."""
    if not session.ready or session.retriever is None:
        raise RuntimeError("RAG pipeline not initialised. Upload documents first.")

    docs = session.retriever.vectorstore.similarity_search(question, k=10)

    relevant_images: list[dict] = []
    seen: set[str] = set()
    for doc in docs:
        if doc.metadata.get("type") != "image":
            continue
        doc_id = doc.metadata.get("doc_id")
        if not doc_id:
            continue
        stored = session.retriever.docstore.mget([doc_id])
        if not stored or stored[0] is None:
            continue
        try:
            parsed = json.loads(stored[0])
            if parsed.get("type") != "image":
                continue
            meta = parsed.get("metadata", {})
            fname = meta.get("filename", "")
            if fname in seen:
                continue
            for im in session.image_metadata:
                if im["filename"] == fname and im["pdf_source"] == meta.get("pdf_source"):
                    seen.add(fname)
                    relevant_images.append(
                        {
                            "filename": im["filename"],
                            "pdf_source": im["pdf_source"],
                            "page_number": im["page_number"],
                            "image_index": im["image_index"],
                            "preview_url": f"/api/pdf-chat/images/{os.path.basename(im['path'])}",
                            "base64_preview": resize_base64_image(im["base64"]),
                        }
                    )
                    break
        except (json.JSONDecodeError, KeyError):
            continue

    answer = session.chain.invoke(question)  # type: ignore[union-attr]

    return {
        "answer": answer,
        "relevant_docs_count": len(docs),
        "relevant_images": relevant_images[:3],
    }
