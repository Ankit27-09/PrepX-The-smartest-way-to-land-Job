"""URL normalization utilities."""

from urllib.parse import urlparse, urlunparse


def normalize_url(url: str) -> str:
    """Normalize a URL by stripping fragments and trailing slashes."""
    if not url:
        return url
    try:
        parsed = urlparse(url)
        # Remove fragment, keep everything else
        normalized = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path.rstrip("/"),
            parsed.params,
            parsed.query,
            "",  # drop fragment
        ))
        return normalized
    except Exception:
        return url
