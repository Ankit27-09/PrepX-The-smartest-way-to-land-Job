"""
LiveKit Interview Agent

Two modes optimised for different latency / feature trade-offs:

  Voice mode  → STT-LLM-TTS pipeline  (Deepgram Nova-3 + Gemini Flash + Cartesia Sonic-3)
                Silero VAD + LiveKit turn-detector + preemptive generation → ~1 s response
  Avatar mode → Gemini Live API realtime model + Beyond Presence avatar

Both modes share the same InterviewAgent, system prompt, and MongoDB integration.
"""

import asyncio
import json
import logging
import os
import random
import re
from html import unescape
from pathlib import Path
from typing import Any

import httpx
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from livekit import agents, rtc
from livekit.agents import (
    AgentServer,
    AgentSession,
    Agent,
    ChatContext,
    RunContext,
    function_tool,
    room_io,
    get_job_context,
)
from livekit.agents.llm import ImageContent
from livekit.plugins import google, silero, bey, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit import api

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH, override=True)

logger = logging.getLogger("interview-agent")

# ── Avatar ID mapping (must match frontend selection) ──────────────────────
AVATAR_IDS: dict[str, str] = {
    "ege": "b9be11b8-89fb-4227-8f86-4a881393cbdb",
    "awais": "2ed7477f-3961-4ce1-b331-5e4530c55a57",
    "zaid": "1c7a7291-ee28-4800-8f34-acfbfc2d07c0",
    "nelly": "b5bebaf9-ae80-4e43-b97f-4506136ed926",
    "fjolla": "2bc759ab-a7e5-4b91-941d-9e42450d6546",
    "michael": "7124071d-480e-4fdc-ad0e-a2e0680f1378",
    "laura": "7c9ca52f-d4f7-46e1-a4b8-0c8655857cc3",
    "jerome": "b63ba4e6-d346-45d0-ad28-5ddffaac0bd0_v2",
}

# ── MongoDB helpers ────────────────────────────────────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "int_test")


async def fetch_interview(interview_id: str) -> dict | None:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    try:
        return await db.interviews.find_one({"_id": ObjectId(interview_id)})
    finally:
        client.close()


async def update_interview_status(
    interview_id: str, status: str, extra: dict | None = None
):
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    try:
        update: dict[str, Any] = {"status": status}
        if extra:
            update.update(extra)
        await db.interviews.update_one(
            {"_id": ObjectId(interview_id)}, {"$set": update}
        )
    finally:
        client.close()


# ── System prompt builder ──────────────────────────────────────────────────
def build_system_prompt(interview: dict) -> str:
    job = interview.get("job_details") or {}
    ctx = interview.get("interview_context") or {}
    settings = interview.get("interview_settings") or {}

    difficulty = ctx.get("difficulty_level", "medium")
    focus_areas = ", ".join(ctx.get("focus_areas", [])) or "general"
    duration = settings.get("duration", "30")
    language = settings.get("language", "english")
    resume_text = ctx.get("resume_text", "")
    additional_context = ctx.get("additional_context", "")
    coding_platform = ctx.get("coding_platform", "leetcode")

    prompt = (
        "You are a professional AI interviewer conducting a real-time voice interview. "
        "Keep every response concise, conversational, and natural. "
        "Never use markdown formatting, asterisks, bullet points, or emojis.\n\n"
        f"Position: {job.get('job_title', 'Software Engineer')} at {job.get('company', 'the company')}\n"
        f"Location: {job.get('location', 'Not specified')} | Type: {job.get('employment_type', 'full-time')} | Level: {job.get('experience_level', 'mid')}\n"
        f"Skills required: {', '.join(job.get('skills', [])) or 'Not specified'}\n"
        f"Difficulty: {difficulty} | Focus: {focus_areas} | Duration: {duration} min | Language: {language}\n"
        f"Coding platform: {coding_platform}\n\n"
        f"Job description: {job.get('job_description', 'Not provided')}\n\n"
        "Guidelines:\n"
        f"1. Greet the candidate and introduce yourself as the interviewer for the {job.get('job_title', '')} role.\n"
        "2. Ask one question at a time; wait for the full answer before moving on.\n"
        "3. Follow up when answers are vague.\n"
        f"4. Cover technical, problem-solving, and behavioral questions for: {focus_areas}.\n"
        f"5. Adjust complexity to {difficulty} level.\n"
        f"6. You have about {duration} minutes total.\n"
        "7. Near the end, ask if the candidate has questions about the role.\n"
        "8. Close professionally.\n"
        f"9. Conduct the interview in {language}.\n\n"
        "=== CODING ROUND INSTRUCTIONS ===\n"
        "10. During the interview, you MUST present at least one coding challenge using the fetch_and_send_coding_question tool.\n"
        f"    This tool fetches a real problem from {coding_platform.capitalize()} matching the {difficulty} difficulty level.\n"
        "    The question will be automatically sent to the candidate's screen.\n"
        "    You can also still use send_coding_question to create custom questions if needed.\n"
        "11. Before presenting the coding question, ask the candidate to share their screen using the request_screen_share tool.\n"
        "12. After sending the question, tell the candidate they can use the code editor panel on the right side of the screen.\n"
        "    Tell them they can run their code and when they are done, they can submit it using the Submit button.\n"
        "13. When the candidate submits their code, you will receive it. Review the code thoroughly and provide feedback on:\n"
        "    - Correctness: Does the code produce the right output?\n"
        "    - Time/space complexity\n"
        "    - Code quality and readability\n"
        "    - Edge case handling\n"
        "    - Suggest improvements if any\n"
        "14. Discuss the candidate's approach and thought process verbally while they code.\n\n"
        "=== SYSTEM DESIGN ROUND INSTRUCTIONS ===\n"
        "15. For senior or system design focused roles, also present a system design challenge using the send_system_design_question tool.\n"
        "    This opens a whiteboard (Excalidraw) where the candidate can draw their architecture.\n"
        "    - For medium: design a URL shortener, rate limiter, or notification system\n"
        "    - For hard: design Twitter feed, YouTube, or a distributed cache\n"
        "16. Include specific requirements (e.g., handle 1M DAU, low latency reads) and optional hints.\n"
        "17. While the candidate draws, discuss their thought process. Ask about trade-offs, scaling, and failure modes.\n"
        "18. When the candidate submits their diagram, acknowledge it and discuss the architecture they drew.\n"
        "    Comment on component choices, data flow, potential bottlenecks, and scaling strategies.\n"
    )

    if additional_context:
        prompt += f"\nAdditional instructions: {additional_context}\n"
    if resume_text:
        prompt += f"\nCandidate resume (use to personalise questions):\n{resume_text[:2000]}\n"

    return prompt


# ── LeetCode / Codeforces helpers ──────────────────────────────────────────

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/"
LEETCODE_PROBLEMS_URL = "https://leetcode.com/api/problems/all/"
CODEFORCES_API_URL = "https://codeforces.com/api"

_LC_LEVEL_MAP = {"easy": 1, "medium": 2, "hard": 3, "expert": 3}
_CF_RATING = {"easy": (800, 1200), "medium": (1300, 1800), "hard": (1900, 2400), "expert": (2500, 3500)}
_HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0", "Referer": "https://leetcode.com"}


def _strip_html(html: str) -> str:
    """Remove HTML tags and normalize whitespace."""
    t = re.sub(r"<br\s*/?>", "\n", html)
    t = re.sub(r"</?p>", "\n", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = unescape(t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t


async def _lc_random_question(difficulty: str) -> dict | None:
    """Fetch a random free LeetCode question with full content."""
    level = _LC_LEVEL_MAP.get(difficulty, 2)
    detail_query = (
        "query questionData($titleSlug: String!) { "
        "question(titleSlug: $titleSlug) { "
        "questionId questionFrontendId title titleSlug content "
        "isPaidOnly difficulty topicTags { name slug } "
        "exampleTestcases "
        "} }"
    )
    async with httpx.AsyncClient(timeout=20.0) as http:
        resp = await http.get(LEETCODE_PROBLEMS_URL, headers=_HEADERS)
        resp.raise_for_status()
        pairs = resp.json().get("stat_status_pairs", [])
        filtered = [
            p for p in pairs
            if p.get("difficulty", {}).get("level") == level
            and not p.get("paid_only", False)
        ]
        if not filtered:
            return None
        random.shuffle(filtered)
        for p in filtered[:10]:
            slug = p.get("stat", {}).get("question__title_slug", "")
            if not slug:
                continue
            r2 = await http.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": detail_query, "variables": {"titleSlug": slug}},
                headers=_HEADERS,
            )
            r2.raise_for_status()
            detail = r2.json().get("data", {}).get("question", {})
            if not detail or detail.get("isPaidOnly"):
                continue
            parsed = _parse_html(detail.get("content", ""))
            return {
                "platform": "leetcode",
                "title": detail.get("title", ""),
                "difficulty": detail.get("difficulty", "Medium").lower(),
                "htmlContent": detail.get("content", ""),
                "description": parsed["description"],
                "examples": parsed["examples"],
                "tags": [t["name"] for t in detail.get("topicTags", [])],
                "url": f"https://leetcode.com/problems/{detail['titleSlug']}/",
            }
    return None


async def _cf_random_question(difficulty: str) -> dict | None:
    """Fetch a random Codeforces question for the given difficulty."""
    lo, hi = _CF_RATING.get(difficulty, (1300, 1800))
    async with httpx.AsyncClient(timeout=15.0) as http:
        resp = await http.get(f"{CODEFORCES_API_URL}/problemset.problems")
        resp.raise_for_status()
        data = resp.json()
    if data.get("status") != "OK":
        return None
    problems = data.get("result", {}).get("problems", [])
    filtered = [p for p in problems if p.get("rating") and lo <= p["rating"] <= hi]
    if not filtered:
        return None
    sel = random.choice(filtered)
    cid, idx = sel.get("contestId", ""), sel.get("index", "")
    rating = sel.get("rating", 0)
    diff = "easy" if rating <= 1200 else ("medium" if rating <= 1800 else "hard")

    description, examples = "", []
    try:
        url = f"https://codeforces.com/problemset/problem/{cid}/{idx}"
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as http:
            r = await http.get(url)
            if r.status_code == 200:
                html = r.text
                m = re.search(r'<div class="problem-statement">(.*?)</div>\s*</div>\s*</div>', html, re.DOTALL)
                if m:
                    raw = re.sub(r'<div class="header">.*?</div>\s*</div>', '', m.group(1), flags=re.DOTALL)
                    description = _strip_html(raw)[:3000]
                for inp, out in zip(
                    re.findall(r'<div class="input">.*?<pre[^>]*>(.*?)</pre>', html, re.DOTALL),
                    re.findall(r'<div class="output">.*?<pre[^>]*>(.*?)</pre>', html, re.DOTALL),
                ):
                    examples.append({
                        "input": re.sub(r"<[^>]+>", "\n", inp).strip(),
                        "output": re.sub(r"<[^>]+>", "\n", out).strip(),
                    })
    except Exception:
        pass
    if not description:
        description = (
            f"Codeforces Problem {cid}{idx} — {sel.get('name', '')}\n"
            f"Rating: {rating} | Tags: {', '.join(sel.get('tags', []))}\n\n"
            f"View the full problem at: https://codeforces.com/problemset/problem/{cid}/{idx}"
        )
    return {
        "platform": "codeforces",
        "title": sel.get("name", ""),
        "difficulty": diff,
        "description": description,
        "examples": examples,
        "tags": sel.get("tags", []),
        "url": f"https://codeforces.com/problemset/problem/{cid}/{idx}",
    }


def _parse_html(html: str) -> dict:
    """Strip HTML → plain text description + examples."""
    if not html:
        return {"description": "", "examples": []}
    t = html
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"</?p>", "\n", t)
    t = re.sub(r"</?li>", "\n", t)
    t = re.sub(r"</?[uo]l>", "\n", t)
    t = re.sub(r"<code>(.*?)</code>", r"\1", t)
    t = re.sub(r"<strong>(.*?)</strong>", r"\1", t)
    t = re.sub(r"<em>(.*?)</em>", r"\1", t)
    t = re.sub(r"<pre>(.*?)</pre>", r"\1", t, flags=re.DOTALL)
    t = re.sub(r"<[^>]+>", "", t)
    t = unescape(t)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    examples: list[dict] = []
    pat = (
        r"Example\s*\d*:?\s*\n*Input:\s*(.*?)\s*\n+Output:\s*(.*?)\s*"
        r"(?:\n+Explanation:\s*(.*?))?(?=\n*Example\s*\d|\n*Constraints|\n*Note|\n*Follow|$)"
    )
    for m in re.finditer(pat, t, re.DOTALL | re.IGNORECASE):
        ex: dict[str, str] = {"input": m.group(1).strip(), "output": m.group(2).strip()}
        if m.group(3) and m.group(3).strip():
            ex["explanation"] = m.group(3).strip()
        examples.append(ex)
    parts = re.split(r"Example\s*\d*:", t, maxsplit=1, flags=re.IGNORECASE)
    desc = parts[0].strip() if parts else t
    return {"description": desc, "examples": examples}


# ── Agent class ────────────────────────────────────────────────────────────
class InterviewAgent(Agent):
    def __init__(self, interview: dict, chat_ctx: ChatContext | None = None) -> None:
        self._interview = interview
        self._interview_id = str(interview["_id"])
        super().__init__(
            instructions=build_system_prompt(interview),
            chat_ctx=chat_ctx,
        )

    @function_tool()
    async def end_interview(self, context: RunContext) -> str:
        """Call this tool when the interview is finished or the candidate wants to end early."""
        await context.wait_for_playout()
        await update_interview_status(self._interview_id, "completed")
        job_ctx = get_job_context()
        if job_ctx:
            job_ctx.shutdown("interview ended")
        return "Interview ended. Thank you!"

    @function_tool()
    async def fetch_and_send_coding_question(self, context: RunContext) -> str:
        """Fetch a real coding question from LeetCode or Codeforces (based on the interview configuration) and send it to the candidate's screen.
        The question is fetched from the platform selected during interview setup and matches the configured difficulty level.
        Call this when you want the candidate to solve a coding problem. The question will appear in a panel on the candidate's screen.
        You do NOT need to provide any parameters — the platform and difficulty are read from the interview configuration automatically.
        """
        job_ctx = get_job_context()
        if not job_ctx:
            return "Failed: no job context"

        ctx = self._interview.get("interview_context") or {}
        platform = ctx.get("coding_platform", "leetcode")
        difficulty = ctx.get("difficulty_level", "medium")

        logger.info("Fetching %s question at %s difficulty", platform, difficulty)

        try:
            if platform == "codeforces":
                question = await _cf_random_question(difficulty)
            else:
                question = await _lc_random_question(difficulty)
        except Exception as e:
            logger.error("Failed to fetch %s question: %s", platform, e)
            return f"Failed to fetch question from {platform}. You can use send_coding_question to create a custom question instead."

        if not question:
            return f"No {platform} questions found for {difficulty} difficulty. Use send_coding_question to create a custom question instead."

        examples = question.get("examples", [])[:2]
        if not examples:
            examples = [{"input": "See problem description", "output": "See problem description"}]

        question_data = {
            "type": "coding-question",
            "question": {
                "title": question["title"],
                "difficulty": question["difficulty"],
                "htmlContent": question.get("htmlContent", ""),
                "description": question["description"],
                "examples": examples,
                "platform": platform,
                "url": question.get("url", ""),
                "tags": question.get("tags", []),
            },
        }

        payload = json.dumps(question_data).encode("utf-8")
        await job_ctx.room.local_participant.publish_data(
            payload, reliable=True, topic="coding-question"
        )

        tags_str = ", ".join(question.get("tags", [])[:5])
        logger.info("Sent %s question: %s", platform, question["title"])
        return (
            f"A {platform.capitalize()} coding question has been sent to the candidate's screen:\n"
            f"Title: {question['title']}\n"
            f"Difficulty: {question['difficulty']}\n"
            f"Tags: {tags_str}\n"
            f"URL: {question.get('url', '')}\n\n"
            f"Tell the candidate to check the Question panel on the left side and use the code editor to solve it."
        )

    @function_tool()
    async def send_coding_question(
        self,
        context: RunContext,
        title: str,
        difficulty: str,
        description: str,
        example_1_input: str,
        example_1_output: str,
        example_2_input: str = "",
        example_2_output: str = "",
        example_1_explanation: str = "",
        example_2_explanation: str = "",
    ) -> str:
        """Send a coding question/DSA problem to the candidate's screen.
        The question will appear in a panel on the candidate's screen with the title, difficulty, description, and examples.
        Call this when you want the candidate to solve a coding problem.
        Parameters:
            title: The title of the coding problem (e.g., "Two Sum", "Reverse Linked List")
            difficulty: One of "easy", "medium", or "hard"
            description: Full problem description explaining what the candidate needs to solve
            example_1_input: Input for the first example
            example_1_output: Expected output for the first example
            example_2_input: (Optional) Input for second example
            example_2_output: (Optional) Expected output for second example
            example_1_explanation: (Optional) Explanation for first example
            example_2_explanation: (Optional) Explanation for second example
        """
        job_ctx = get_job_context()
        if not job_ctx:
            return "Failed: no job context"

        examples = [{"input": example_1_input, "output": example_1_output}]
        if example_1_explanation:
            examples[0]["explanation"] = example_1_explanation
        if example_2_input and example_2_output:
            ex2: dict[str, str] = {"input": example_2_input, "output": example_2_output}
            if example_2_explanation:
                ex2["explanation"] = example_2_explanation
            examples.append(ex2)

        question_data = {
            "type": "coding-question",
            "question": {
                "title": title,
                "difficulty": difficulty,
                "description": description,
                "examples": examples,
            },
        }

        payload = json.dumps(question_data).encode("utf-8")
        await job_ctx.room.local_participant.publish_data(
            payload, reliable=True, topic="coding-question"
        )

        logger.info("Sent coding question: %s", title)
        return f"Coding question '{title}' has been sent to the candidate's screen. Tell them to check the Question panel on the left side."

    @function_tool()
    async def request_screen_share(self, context: RunContext) -> str:
        """Ask the candidate to share their screen. Call this before the coding round so you can see the candidate's code editor.
        This sends a notification to the candidate's screen asking them to share."""
        job_ctx = get_job_context()
        if not job_ctx:
            return "Failed: no job context"

        payload = json.dumps({
            "type": "screen-share-request",
            "message": "Please share your screen so I can see your code editor.",
        }).encode("utf-8")

        await job_ctx.room.local_participant.publish_data(
            payload, reliable=True, topic="screen-share-request"
        )

        logger.info("Sent screen share request")
        return "Screen share request sent. Ask the candidate to click the 'Share screen' button in the control bar."

    @function_tool()
    async def send_system_design_question(
        self,
        context: RunContext,
        title: str,
        scenario: str,
        requirement_1: str,
        requirement_2: str,
        requirement_3: str = "",
        requirement_4: str = "",
        hint_1: str = "",
        hint_2: str = "",
        hint_3: str = "",
    ) -> str:
        """Send a system design question to the candidate's whiteboard.
        The whiteboard (Excalidraw) will open on the candidate's screen where they can draw their system architecture.
        Call this when you want the candidate to design a system.
        Parameters:
            title: The title of the system design problem (e.g., "Design a URL Shortener", "Design Twitter Feed")
            scenario: The full scenario/problem description explaining what the candidate needs to design
            requirement_1: First key requirement (e.g., "Handle 1M daily active users")
            requirement_2: Second key requirement (e.g., "Low latency reads < 100ms")
            requirement_3: (Optional) Third requirement
            requirement_4: (Optional) Fourth requirement
            hint_1: (Optional) A hint to guide the candidate
            hint_2: (Optional) A second hint
            hint_3: (Optional) A third hint
        """
        job_ctx = get_job_context()
        if not job_ctx:
            return "Failed: no job context"

        requirements = [r for r in [requirement_1, requirement_2, requirement_3, requirement_4] if r]
        hints = [h for h in [hint_1, hint_2, hint_3] if h]

        question_data = {
            "type": "system-design-question",
            "question": {
                "title": title,
                "scenario": scenario,
                "requirements": requirements,
                "hints": hints if hints else None,
            },
        }

        payload = json.dumps(question_data).encode("utf-8")
        await job_ctx.room.local_participant.publish_data(
            payload, reliable=True, topic="system-design-question"
        )

        logger.info("Sent system design question: %s", title)
        return (
            f"System design question '{title}' has been sent to the candidate's whiteboard. "
            "Tell them to use the Whiteboard panel to draw their architecture. "
            "They can use shapes, arrows, and text to illustrate components like servers, databases, caches, load balancers, etc. "
            "When they're done, they can click 'Submit Diagram' to send it to you."
        )


# ── Agent Server ───────────────────────────────────────────────────────────
server = AgentServer()


@server.rtc_session(agent_name="interview-agent")
async def interview_agent(ctx: agents.JobContext):
    """
    Entry-point.  Metadata JSON: {"interview_id": "...", "avatar_model": "michael"}
    """
    metadata: dict = {}
    if ctx.job.metadata:
        try:
            metadata = json.loads(ctx.job.metadata)
        except json.JSONDecodeError:
            metadata = {}

    interview_id = metadata.get("interview_id")
    avatar_model = metadata.get("avatar_model", "michael")

    # ── Load interview from DB ─────────────────────────────────────────
    interview: dict = {}
    if interview_id:
        interview = (await fetch_interview(interview_id)) or {}
        if interview:
            await update_interview_status(interview_id, "in_progress")

    # ── Resolve avatar & mode ──────────────────────────────────────────
    avatar_id = AVATAR_IDS.get(avatar_model, AVATAR_IDS["michael"])
    interview_mode = "3d-avatar"
    if interview:
        settings = interview.get("interview_settings") or {}
        interview_mode = settings.get("interview_mode", "3d-avatar")
        stored_avatar = settings.get("avatar_model", avatar_model)
        avatar_id = AVATAR_IDS.get(stored_avatar, avatar_id)

    # ── Initial chat context ───────────────────────────────────────────
    initial_ctx = ChatContext()
    if interview:
        job = interview.get("job_details") or {}
        initial_ctx.add_message(
            role="assistant",
            content=(
                f"This interview is for the {job.get('job_title', 'open')} position "
                f"at {job.get('company', 'the company')}."
            ),
        )

    use_avatar = interview_mode == "3d-avatar"
    logger.info("interview_mode=%s  use_avatar=%s", interview_mode, use_avatar)

    # ── Start recording (Room Composite Egress → S3) ──────────────────
    egress_info = None
    aws_key = os.getenv("AWS_ACCESS_KEY")
    aws_secret = os.getenv("AWS_SECRET_KEY")
    aws_region = os.getenv("AWS_REGION", "ap-south-1")
    aws_bucket = os.getenv("BUCKET_NAME")

    if aws_key and aws_secret and aws_bucket:
        try:
            file_prefix = f"interviews/{interview_id or ctx.room.name}"
            egress_req = api.RoomCompositeEgressRequest(
                room_name=ctx.room.name,
                audio_only=not use_avatar,
                file_outputs=[
                    api.EncodedFileOutput(
                        file_type=api.EncodedFileType.MP4,
                        filepath=f"{file_prefix}/recording.mp4",
                        s3=api.S3Upload(
                            bucket=aws_bucket,
                            region=aws_region,
                            access_key=aws_key,
                            secret=aws_secret,
                        ),
                    )
                ],
            )
            lkapi = api.LiveKitAPI()
            egress_info = await lkapi.egress.start_room_composite_egress(egress_req)
            await lkapi.aclose()
            logger.info("egress started  egress_id=%s", egress_info.egress_id)

            if interview_id:
                s3_url = f"s3://{aws_bucket}/{file_prefix}/recording.mp4"
                await update_interview_status(
                    interview_id,
                    "in_progress",
                    extra={"recording_url": s3_url, "egress_id": egress_info.egress_id},
                )
        except Exception as e:
            logger.error("failed to start egress: %s", e)
    else:
        logger.warning("AWS credentials not configured — skipping recording")

    # ── Build the AgentSession ─────────────────────────────────────────
    session = AgentSession(
        stt="deepgram/nova-3",
        llm=google.LLM(model="gemini-2.5-flash"),
        tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
        preemptive_generation=True,
    )

    # ── Start Beyond Presence avatar (if 3d-avatar mode) ──────────────
    if use_avatar:
        avatar = bey.AvatarSession(avatar_id=avatar_id)
        await avatar.start(session, room=ctx.room)

    # ── Start the session ──────────────────────────────────────────────
    await session.start(
        room=ctx.room,
        agent=InterviewAgent(
            interview=interview or {"_id": "demo"},
            chat_ctx=initial_ctx,
        ),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        ),
    )

    # ── Listen for code submissions from the candidate ─────────────────
    @ctx.room.on("data_received")
    def on_data_received(data_packet: rtc.DataPacket):
        topic = data_packet.topic
        if topic == "code-submission":
            try:
                text = data_packet.data.decode("utf-8")
                submission = json.loads(text)
                code = submission.get("code", "")
                lang = submission.get("language", "unknown")
                output = submission.get("output", "")

                logger.info("Received code submission (%s): %d chars", lang, len(code))

                asyncio.ensure_future(
                    session.generate_reply(
                        instructions=(
                            f"The candidate has submitted their code solution. Here is the code they wrote in {lang}:\n\n"
                            f"```{lang}\n{code}\n```\n\n"
                            f"Their code output was:\n```\n{output}\n```\n\n"
                            "Review the code thoroughly. Comment on correctness, time/space complexity, "
                            "code quality, edge case handling, and suggest improvements. "
                            "Be encouraging but honest. Discuss the approach conversationally."
                        ),
                    )
                )
            except Exception as e:
                logger.error("Failed to process code submission: %s", e)

        elif topic == "whiteboard-submission":
            try:
                text = data_packet.data.decode("utf-8")
                submission = json.loads(text)
                image_b64 = submission.get("imageBase64", "")
                element_count = submission.get("elementCount", 0)
                question_title = submission.get("questionTitle", "System Design")

                logger.info("Received whiteboard submission for '%s': %d elements", question_title, element_count)

                async def _inject_image_and_evaluate():
                    if image_b64 and session.current_agent:
                        chat_ctx = session.current_agent.chat_ctx.copy()
                        chat_ctx.add_message(
                            role="user",
                            content=[
                                f"The candidate submitted their system design diagram for '{question_title}'. "
                                f"The diagram contains {element_count} elements. "
                                "Please analyze the architecture visually.",
                                ImageContent(
                                    image=f"data:image/png;base64,{image_b64}"
                                ),
                            ],
                        )
                        await session.current_agent.update_chat_ctx(chat_ctx)

                    await session.generate_reply(
                        instructions=(
                            f"The candidate has submitted their system design diagram for '{question_title}'. "
                            f"The diagram contains {element_count} elements (shapes, arrows, text, etc.). "
                            "You can now see the diagram image in the chat context. "
                            "Evaluate the architecture diagram visually and discuss it with the candidate. "
                            "Comment on what you observe in their diagram and ask follow-up questions about:\n"
                            "- The main components you can see and their relationships\n"
                            "- How data flows through the system based on the diagram\n"
                            "- How they would handle scaling and high traffic\n"
                            "- Potential failure points and how they would address them\n"
                            "- Their database choices and why\n"
                            "- Whether they considered caching, load balancing, or message queues\n"
                            "Be conversational and collaborative in your discussion. "
                            "Reference specific parts of their diagram in your feedback."
                        ),
                    )

                asyncio.ensure_future(_inject_image_and_evaluate())
            except Exception as e:
                logger.error("Failed to process whiteboard submission: %s", e)

    # ── Graceful shutdown — drain session before room drops ─────────
    async def _on_shutdown():
        logger.info("Graceful shutdown: draining session")
        try:
            await session.drain()
        except Exception as e:
            logger.debug("Session drain: %s", e)
        try:
            await session.aclose()
        except Exception as e:
            logger.debug("Session close: %s", e)
        # Stop egress recording
        if egress_info:
            try:
                lkapi = api.LiveKitAPI()
                await lkapi.egress.stop_egress(
                    api.StopEgressRequest(egress_id=egress_info.egress_id)
                )
                await lkapi.aclose()
            except Exception:
                pass
        # Delete the room
        try:
            lkapi = api.LiveKitAPI()
            await lkapi.room.delete_room(
                api.DeleteRoomRequest(room=ctx.room.name)
            )
            await lkapi.aclose()
        except Exception:
            pass
        logger.info("Graceful shutdown complete")

    ctx.add_shutdown_callback(_on_shutdown)

    # ── Opening greeting ───────────────────────────────────────────────
    if interview:
        job = interview.get("job_details") or {}
        await session.generate_reply(
            instructions=(
                f"Greet the candidate warmly. Introduce yourself as the AI interviewer "
                f"for the {job.get('job_title', '')} position at "
                f"{job.get('company', 'the company')}. "
                f"Briefly explain the interview format: it will include a conversation about their experience, "
                f"technical questions, a coding challenge where they will use the built-in code editor, "
                f"and possibly a system design round where they can use the whiteboard. "
                f"Mention that there is a timer running. Ask if they are ready to begin."
            ),
        )
    else:
        await session.generate_reply(
            instructions="Greet the user and introduce yourself as an AI interviewer. Ask how you can help.",
        )


if __name__ == "__main__":
    agents.cli.run_app(server)
