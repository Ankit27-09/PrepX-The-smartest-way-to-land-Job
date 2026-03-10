"""
Service for fetching coding questions from LeetCode and Codeforces APIs.

LeetCode:  GraphQL API at https://leetcode.com/graphql
Codeforces: REST API at https://codeforces.com/api/
"""

import random
import re
from html import unescape

import httpx

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/"
LEETCODE_PROBLEMS_URL = "https://leetcode.com/api/problems/all/"
CODEFORCES_API_URL = "https://codeforces.com/api"

CF_RATING_RANGES: dict[str, tuple[int, int]] = {
    "easy": (800, 1200),
    "medium": (1300, 1800),
    "hard": (1900, 2400),
    "expert": (2500, 3500),
}

LEETCODE_DIFFICULTY_MAP: dict[str, int] = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
    "expert": 3,
}

_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://leetcode.com",
}


# ── LeetCode ───────────────────────────────────────────────────────────────


async def _lc_fetch_list(difficulty: str) -> list[dict]:
    """Return free LeetCode question slugs for *difficulty* via the REST API."""
    level = LEETCODE_DIFFICULTY_MAP.get(difficulty, 2)

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(LEETCODE_PROBLEMS_URL, headers=_HEADERS)
        resp.raise_for_status()

    data = resp.json()
    pairs = data.get("stat_status_pairs", [])

    filtered = [
        p for p in pairs
        if p.get("difficulty", {}).get("level") == level
        and not p.get("paid_only", False)
    ]
    return filtered


async def _lc_fetch_detail(title_slug: str) -> dict:
    """Fetch the full content of a single LeetCode problem."""
    query = (
        "query questionData($titleSlug: String!) { "
        "question(titleSlug: $titleSlug) { "
        "questionId questionFrontendId title titleSlug content "
        "isPaidOnly difficulty topicTags { name slug } "
        "exampleTestcases "
        "} }"
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": query, "variables": {"titleSlug": title_slug}},
            headers=_HEADERS,
        )
        resp.raise_for_status()

    return resp.json().get("data", {}).get("question", {})


def _parse_lc_html(html: str) -> dict:
    """Strip HTML from LeetCode content to plain text description + examples."""
    if not html:
        return {"description": "", "examples": []}

    text = html
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"</?p>", "\n", text)
    text = re.sub(r"</?li>", "\n", text)
    text = re.sub(r"</?[uo]l>", "\n", text)
    text = re.sub(r"<code>(.*?)</code>", r"\1", text)
    text = re.sub(r"<strong>(.*?)</strong>", r"\1", text)
    text = re.sub(r"<em>(.*?)</em>", r"\1", text)
    text = re.sub(r"<pre>(.*?)</pre>", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    examples: list[dict] = []
    pattern = (
        r"Example\s*\d*:?\s*\n*"
        r"Input:\s*(.*?)\s*\n+"
        r"Output:\s*(.*?)\s*"
        r"(?:\n+Explanation:\s*(.*?))?"
        r"(?=\n*Example\s*\d|\n*Constraints|\n*Note|\n*Follow|$)"
    )
    for m in re.finditer(pattern, text, re.DOTALL | re.IGNORECASE):
        ex: dict[str, str] = {
            "input": m.group(1).strip(),
            "output": m.group(2).strip(),
        }
        if m.group(3) and m.group(3).strip():
            ex["explanation"] = m.group(3).strip()
        examples.append(ex)

    parts = re.split(r"Example\s*\d*:", text, maxsplit=1, flags=re.IGNORECASE)
    description = parts[0].strip() if parts else text

    return {"description": description, "examples": examples}


async def get_leetcode_question(difficulty: str = "medium") -> dict | None:
    """Return a random free LeetCode question with parsed content."""
    problems = await _lc_fetch_list(difficulty)
    if not problems:
        return None

    random.shuffle(problems)

    for p in problems[:10]:
        stat = p.get("stat", {})
        slug = stat.get("question__title_slug", "")
        if not slug:
            continue

        detail = await _lc_fetch_detail(slug)
        if not detail or detail.get("isPaidOnly"):
            continue

        parsed = _parse_lc_html(detail.get("content", ""))
        return {
            "platform": "leetcode",
            "id": detail.get("questionFrontendId", ""),
            "title": detail.get("title", ""),
            "difficulty": detail.get("difficulty", "Medium").lower(),
            "htmlContent": detail.get("content", ""),
            "description": parsed["description"],
            "examples": parsed["examples"],
            "tags": [t["name"] for t in detail.get("topicTags", [])],
            "url": f"https://leetcode.com/problems/{detail['titleSlug']}/",
        }

    return None


# ── Codeforces ─────────────────────────────────────────────────────────────

async def _cf_fetch_problems() -> list[dict]:
    """Fetch the full Codeforces problem set."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{CODEFORCES_API_URL}/problemset.problems")
        resp.raise_for_status()

    data = resp.json()
    if data.get("status") != "OK":
        return []
    return data.get("result", {}).get("problems", [])


async def get_codeforces_question(difficulty: str = "medium") -> dict | None:
    """Return a random Codeforces question for *difficulty*."""
    problems = await _cf_fetch_problems()
    if not problems:
        return None

    lo, hi = CF_RATING_RANGES.get(difficulty, (1300, 1800))
    filtered = [p for p in problems if p.get("rating") and lo <= p["rating"] <= hi]
    if not filtered:
        return None

    selected = random.choice(filtered)
    contest_id = selected.get("contestId", "")
    index = selected.get("index", "")
    rating = selected.get("rating", 0)
    tags = selected.get("tags", [])

    if rating <= 1200:
        diff = "easy"
    elif rating <= 1800:
        diff = "medium"
    else:
        diff = "hard"

    description = ""
    examples: list[dict] = []
    try:
        url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                html = resp.text
                stmt_match = re.search(
                    r'<div class="problem-statement">(.*?)</div>\s*</div>\s*</div>',
                    html, re.DOTALL,
                )
                if stmt_match:
                    raw = stmt_match.group(1)
                    raw = re.sub(r'<div class="header">.*?</div>\s*</div>', '', raw, flags=re.DOTALL)
                    clean = re.sub(r"<br\s*/?>", "\n", raw)
                    clean = re.sub(r"</?p>", "\n", clean)
                    clean = re.sub(r"<[^>]+>", " ", clean)
                    clean = unescape(clean)
                    clean = re.sub(r"[ \t]+", " ", clean)
                    clean = re.sub(r"\n{3,}", "\n\n", clean).strip()
                    description = clean[:3000]

                in_blocks = re.findall(
                    r'<div class="input">.*?<pre[^>]*>(.*?)</pre>',
                    html, re.DOTALL,
                )
                out_blocks = re.findall(
                    r'<div class="output">.*?<pre[^>]*>(.*?)</pre>',
                    html, re.DOTALL,
                )
                for inp, out in zip(in_blocks, out_blocks):
                    inp_clean = re.sub(r"<[^>]+>", "\n", inp).strip()
                    out_clean = re.sub(r"<[^>]+>", "\n", out).strip()
                    examples.append({"input": inp_clean, "output": out_clean})
    except Exception:
        pass

    if not description:
        description = (
            f"Codeforces Problem {contest_id}{index} — {selected.get('name', '')}\n"
            f"Rating: {rating} | Tags: {', '.join(tags)}\n\n"
            f"View the full problem statement at:\n"
            f"https://codeforces.com/problemset/problem/{contest_id}/{index}"
        )

    return {
        "platform": "codeforces",
        "id": f"{contest_id}{index}",
        "title": selected.get("name", ""),
        "difficulty": diff,
        "rating": rating,
        "description": description,
        "examples": examples,
        "tags": tags,
        "url": f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
    }


# ── Public API ─────────────────────────────────────────────────────────────

async def get_random_question(
    platform: str = "leetcode",
    difficulty: str = "medium",
) -> dict | None:
    """Get a random coding question from *platform* at *difficulty*."""
    if platform == "codeforces":
        return await get_codeforces_question(difficulty)
    return await get_leetcode_question(difficulty)
