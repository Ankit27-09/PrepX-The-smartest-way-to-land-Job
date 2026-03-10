"""Centralized settings — loads all environment variables for the job feature."""

import os
from pathlib import Path
from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_PROJECT_ROOT / ".env", override=True)


class Settings:
    """Application settings loaded from environment variables."""

    # ── Google / Gemini ──────────────────────────────────────────────────
    @property
    def google_api_key(self) -> str:
        return os.getenv("GOOGLE_API_KEY", "")

    @property
    def google_cloud_api(self) -> str:
        """Alias used by embedding functions."""
        return self.google_api_key

    # ── SerpAPI ──────────────────────────────────────────────────────────
    @property
    def serpapi_key(self) -> str:
        return os.getenv("SERPAPI_KEY", "")

    # ── Groq ─────────────────────────────────────────────────────────────
    @property
    def groq_api_key(self) -> str:
        return os.getenv("GROQ_API_KEY", "")

    # ── MongoDB ──────────────────────────────────────────────────────────
    @property
    def mongodb_uri(self) -> str:
        return os.getenv("MONGODB_URI", "mongodb://localhost:27017/prepx")

    @property
    def mongodb_db_name(self) -> str:
        """Extract database name from the URI path."""
        from urllib.parse import urlparse
        parsed = urlparse(self.mongodb_uri)
        db = parsed.path.lstrip("/").split("?")[0]
        return db or "prepx"

    # ── Chroma (vector DB) ───────────────────────────────────────────────
    @property
    def chroma_api_key(self) -> str:
        return os.getenv("CHROMA_API_KEY", "")

    @property
    def chroma_tenant(self) -> str:
        return os.getenv("CHROMA_TENANT", "")

    @property
    def chroma_database(self) -> str:
        return os.getenv("CHROMA_DATABASE", "")

    # ── JobSpy ───────────────────────────────────────────────────────────
    @property
    def jobspy_enabled(self) -> bool:
        return os.getenv("JOBSPY_ENABLED", "false").lower() == "true"

    @property
    def jobspy_sites(self) -> str:
        return os.getenv("JOBSPY_SITES", "linkedin,indeed")

    @property
    def jobspy_proxies(self) -> str:
        return os.getenv("JOBSPY_PROXIES", "")

    @property
    def jobspy_results_wanted(self) -> int:
        return int(os.getenv("JOBSPY_RESULTS_WANTED", "20"))

    @property
    def jobspy_hours_old(self) -> int:
        return int(os.getenv("JOBSPY_HOURS_OLD", "168"))

    @property
    def jobspy_country_indeed(self) -> str:
        return os.getenv("JOBSPY_COUNTRY_INDEED", "India")

    # ── LiveKit ──────────────────────────────────────────────────────────
    @property
    def livekit_url(self) -> str:
        return os.getenv("LIVEKIT_URL", "")

    @property
    def livekit_api_key(self) -> str:
        return os.getenv("LIVEKIT_API_KEY", "")

    @property
    def livekit_api_secret(self) -> str:
        return os.getenv("LIVEKIT_API_SECRET", "")


settings = Settings()
