"""Salary parsing utilities."""

import re
from typing import Optional, Tuple


def parse_salary_range(text: str) -> Tuple[Optional[int], Optional[int]]:
    """Extract min/max salary from a text string. Returns (min, max) or (None, None)."""
    if not text:
        return None, None

    text = text.replace(",", "")

    # Pattern: $120k - $180k  or  $120,000 - $180,000  or  120k-180k
    pattern = r'\$?\s*(\d+)\s*k?\s*[-–to]+\s*\$?\s*(\d+)\s*k?'
    match = re.search(pattern, text, re.IGNORECASE)

    if match:
        low = int(match.group(1))
        high = int(match.group(2))

        # If values look like shorthand (e.g., 120 meaning 120k)
        if low < 1000:
            low *= 1000
        if high < 1000:
            high *= 1000

        return low, high

    # Single value: $150k or $150,000
    single = re.search(r'\$?\s*(\d+)\s*k?', text, re.IGNORECASE)
    if single:
        val = int(single.group(1))
        if val < 1000:
            val *= 1000
        return val, None

    return None, None
