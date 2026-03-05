"""Application configuration — env vars, paths, API keys."""

import os
from pathlib import Path

from dotenv import load_dotenv
import google.generativeai as genai

# ── Environment ───────────────────────────────────────────────────────────────

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_PROJECT_ROOT / ".env", override=True)

# Remove GEMINI_API_KEY from env to avoid LangChain "Both keys set" warnings
os.environ.pop("GEMINI_API_KEY", None)

GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
genai.configure(api_key=GOOGLE_API_KEY)

# ── Paths ─────────────────────────────────────────────────────────────────────

UPLOAD_DIR = str(_PROJECT_ROOT / "uploads")
EXTRACTED_IMAGES_DIR = str(_PROJECT_ROOT / "uploads" / "extracted_images")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EXTRACTED_IMAGES_DIR, exist_ok=True)

# ── Upload constraints ────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS: set[str] = {"pdf", "jpg", "jpeg", "png"}
MAX_FILE_SIZE: int = 16 * 1024 * 1024  # 16 MB
