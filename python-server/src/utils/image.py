"""Base64 image utility helpers."""

import base64
import io
import re

from PIL import Image


def encode_image(image_path: str) -> str:
    """Read an image file and return its base64-encoded string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def looks_like_base64(text: str) -> bool:
    """Return True when *text* resembles a base64 string."""
    return bool(re.match(r"^[A-Za-z0-9+/]+={0,2}$", text))


def is_image_data(b64data: str) -> bool:
    """Return True when the base64 payload starts with a known image signature."""
    signatures = [
        b"\xFF\xD8\xFF",                        # JPEG
        b"\x89\x50\x4E\x47\x0D\x0A\x1A\x0A",  # PNG
        b"\x47\x49\x46\x38",                    # GIF
        b"\x52\x49\x46\x46",                    # WebP
    ]
    try:
        header = base64.b64decode(b64data)[:8]
        return any(header.startswith(sig) for sig in signatures)
    except Exception:
        return False


def resize_base64_image(b64: str, size: tuple[int, int] = (300, 200)) -> str:
    """Resize a base64 image to *size* and return the new base64 string."""
    try:
        img = Image.open(io.BytesIO(base64.b64decode(b64)))
        img = img.resize(size, Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return b64
