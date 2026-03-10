"""
Career Counselor — Voice Agent
LiveKit voice assistant for real-time career counseling using Gemini Realtime.
Supports both web-based and inbound telephony (SIP) connections.
Reads user career roadmap from MongoDB for personalised advice.
"""

import json
import asyncio
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from livekit import agents, rtc, api
from livekit.agents import (
    AgentServer,
    AgentSession,
    Agent,
    RunContext,
    function_tool,
    room_io,
)
from livekit.plugins import google, bey

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH, override=True)

logger = logging.getLogger("career-counselor")

# ── MongoDB ────────────────────────────────────────────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "int_test")


async def _get_user_by_id(user_id: str) -> dict | None:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    try:
        for col_name in ("users", "User", "user"):
            col = db[col_name]
            try:
                doc = await col.find_one({"_id": ObjectId(user_id)})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
            except Exception:
                doc = await col.find_one({"_id": user_id})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
    finally:
        client.close()
    return None


async def _get_user_by_phone(phone_number: str) -> dict | None:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    try:
        clean = phone_number.replace(" ", "").replace("-", "")
        for col_name in ("users", "User", "user"):
            col = db[col_name]
            doc = await col.find_one({"phone": clean})
            if doc:
                doc["_id"] = str(doc["_id"])
                return doc
            if clean.startswith("+"):
                doc = await col.find_one({"phone": clean[1:]})
            else:
                doc = await col.find_one({"phone": f"+{clean}"})
            if doc:
                doc["_id"] = str(doc["_id"])
                return doc
    finally:
        client.close()
    return None


async def _get_career_roadmap(user_id: str) -> dict | None:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    try:
        doc = await db.career_roadmaps.find_one({"user_id": user_id})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    finally:
        client.close()


# ── System prompt ──────────────────────────────────────────────────────────

BASE_INSTRUCTIONS = """You are an expert career counselor and advisor for the PrepX Career Path Simulator platform.

Your role is to help users navigate their career decisions by providing:

1. **Career Guidance**: Help users understand different career paths, industries, and roles based on their background and interests.
2. **Skill Assessment**: Discuss the user's current skills and identify gaps they need to fill for their target career.
3. **Education Advice**: Provide guidance on courses, certifications, and educational paths that would benefit their career goals.
4. **Market Insights**: Share knowledge about industry trends, job market conditions, and in-demand skills.
5. **Timeline Planning**: Help users create realistic timelines for achieving their career milestones.
6. **Financial Guidance**: Discuss the financial aspects of career transitions, including education costs, expected salaries, and ROI.
7. **Risk Assessment**: Help users understand the risks and challenges associated with different career choices.

**For phone calls**:
- Be extra clear and concise since callers can't see visual aids
- Confirm important information by repeating it back
- Offer to transfer the call if they need a human specialist
- End the call gracefully when the conversation concludes

Conversation Style:
- Be warm, supportive, and encouraging while remaining realistic and honest
- Ask clarifying questions to better understand their background and aspirations
- Provide actionable, specific advice rather than generic suggestions
- Be concise but thorough in your responses
- Speak naturally as if having a real conversation

You have access to the PrepX Career Path Simulator system which can run detailed career simulations.
If the user wants to run a full simulation, guide them to use the platform's simulation feature.
"""


def _build_instructions(
    user_data: dict | None,
    career_roadmap: dict | None,
    is_phone_call: bool = False,
) -> str:
    if user_data and career_roadmap:
        ctx = _format_roadmap(user_data, career_roadmap)
        return (
            BASE_INSTRUCTIONS
            + f"\n\n**EXISTING USER WITH CAREER ROADMAP:**\n"
            f"This {'caller' if is_phone_call else 'user'} is a registered user "
            f"who has already selected a career path and has a personalised roadmap.\n\n"
            f"{ctx}\n\n"
            "Use this information to provide highly personalised advice. "
            "Reference their chosen career path and milestones, help them track progress, "
            "discuss specific skills they need to develop, answer questions about their "
            "financial projections and ROI, and help them stay on track."
        )
    elif user_data:
        name = user_data.get("name") or user_data.get("username") or "there"
        return (
            BASE_INSTRUCTIONS
            + f"\n\n**REGISTERED USER WITHOUT ROADMAP:**\n"
            f"This {'caller' if is_phone_call else 'user'} is registered as {name} "
            f"but hasn't created a career roadmap yet.\n\n"
            "1. Welcome them by name warmly\n"
            "2. Let them know they haven't yet created a career simulation\n"
            "3. Encourage them to use the platform to fill out their career profile "
            "and get matched with ideal career paths\n"
            "4. In the meantime, help them with general career guidance\n"
        )
    else:
        extra = (
            "\n\n**NEW / ANONYMOUS USER:**\n"
            "This user is not logged in or not found in the database.\n"
            "Welcome them warmly, offer general career guidance, "
            "and encourage them to register on PrepX for a personalised experience."
        )
        return BASE_INSTRUCTIONS + extra


def _format_roadmap(user: dict, roadmap: dict) -> str:
    parts: list[str] = []
    name = user.get("name") or user.get("username")
    if name:
        parts.append(f"**Name:** {name}")

    sel = roadmap.get("selected_career")
    if sel:
        parts.append("\n## SELECTED CAREER PATH")
        for key in ("title", "field", "fit_score", "tagline", "difficulty_level", "time_to_entry", "typical_salary_range"):
            v = sel.get(key)
            if v is not None:
                parts.append(f"**{key.replace('_', ' ').title()}:** {v}")

    summary = roadmap.get("summary")
    if summary:
        parts.append("\n## SUMMARY")
        if summary.get("success_probability") is not None:
            parts.append(f"**Success Probability:** {summary['success_probability']}%")
        if summary.get("total_investment") is not None:
            parts.append(f"**Total Investment:** ${summary['total_investment']:,}")
        if summary.get("break_even_year") is not None:
            parts.append(f"**Break Even:** Year {summary['break_even_year']}")

    risk = roadmap.get("risk_assessment")
    if risk:
        parts.append("\n## RISK ASSESSMENT")
        if risk.get("success_probability_score") is not None:
            parts.append(f"**Success Probability:** {risk['success_probability_score']}%")
        for field, label in [("positive_factors", "Positive Factors"), ("key_concerns", "Key Concerns"), ("recommendations", "Recommendations")]:
            items = risk.get(field, [])[:3]
            if items:
                parts.append(f"**{label}:** {', '.join(str(i) for i in items)}")

    fin = roadmap.get("financial_analysis")
    if fin:
        parts.append("\n## FINANCIAL ANALYSIS")
        if fin.get("total_investment_required") is not None:
            parts.append(f"**Total Investment:** ${fin['total_investment_required']:,.0f}")
        if fin.get("five_year_roi") is not None:
            parts.append(f"**5-Year ROI:** {fin['five_year_roi']}%")
        if fin.get("break_even_year") is not None:
            parts.append(f"**Break Even Year:** {fin['break_even_year']}")
        milestones = fin.get("salary_milestones", [])[:3]
        if milestones:
            ms = [f"Year {m.get('year')}: ${m.get('expected_salary'):,}" for m in milestones if isinstance(m, dict) and m.get("year") and m.get("expected_salary")]
            if ms:
                parts.append(f"**Salary Progression:** {' → '.join(ms)}")

    gap = roadmap.get("gap_analysis")
    if gap:
        parts.append("\n## SKILL GAPS")
        if gap.get("overall_gap_score") is not None:
            parts.append(f"**Overall Gap Score:** {gap['overall_gap_score']}/100")
        tech = gap.get("technical_skill_gaps", [])[:5]
        names = [g.get("skill_name") for g in tech if isinstance(g, dict) and g.get("skill_name")]
        if names:
            parts.append(f"**Skills to Develop:** {', '.join(names)}")
        certs = gap.get("certification_gaps", [])[:3]
        if certs:
            parts.append(f"**Certifications Needed:** {', '.join(str(c) for c in certs)}")

    tl = roadmap.get("timeline")
    if tl and isinstance(tl, dict):
        parts.append("\n## TIMELINE")
        if tl.get("recommended_path"):
            parts.append(f"**Recommended Path:** {tl['recommended_path']}")
        for path_type in ("realistic_path", "conservative_path", "ambitious_path"):
            p = tl.get(path_type)
            if p and isinstance(p, dict):
                if p.get("total_years"):
                    parts.append(f"**Total Years:** {p['total_years']}")
                if p.get("final_target_role"):
                    parts.append(f"**Target Role:** {p['final_target_role']}")
                milestones = p.get("major_milestones", [])[:4]
                if milestones:
                    parts.append(f"**Key Milestones:** {'; '.join(str(m) for m in milestones)}")
                break

    return "\n".join(parts) if parts else "Limited roadmap data available."


# ── Agent class ────────────────────────────────────────────────────────────

class CareerCounselor(Agent):
    def __init__(
        self,
        ctx: agents.JobContext,
        is_phone_call: bool = False,
        user_data: dict | None = None,
        career_roadmap: dict | None = None,
    ) -> None:
        self._ctx = ctx
        self._is_phone_call = is_phone_call
        self._user_data = user_data
        self._career_roadmap = career_roadmap
        super().__init__(
            instructions=_build_instructions(user_data, career_roadmap, is_phone_call),
        )

    @function_tool()
    async def end_call(self, ctx: RunContext) -> str:
        """End the current call. Use this when the user wants to hang up or end the conversation."""
        job_ctx = agents.get_job_context()
        if job_ctx:
            job_ctx.shutdown("call ended")
        return "Call ended successfully."

    @function_tool()
    async def transfer_call(self, ctx: RunContext, phone_number: str) -> str:
        """Transfer the call to another phone number (only works for phone calls).

        Args:
            phone_number: The phone number to transfer to (e.g., '+1234567890')
        """
        if not self._is_phone_call:
            return "Call transfer is only available for phone calls, not web sessions."
        try:
            sip_participant = None
            for participant in self._ctx.room.remote_participants.values():
                if participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
                    sip_participant = participant
                    break
            if not sip_participant:
                return "No phone participant found to transfer."
            lk_api = api.LiveKitAPI()
            await lk_api.sip.transfer_sip_participant(
                api.TransferSIPParticipantRequest(
                    room_name=self._ctx.room.name,
                    participant_identity=sip_participant.identity,
                    transfer_to=phone_number,
                )
            )
            await lk_api.aclose()
            return f"Transferring call to {phone_number}"
        except Exception as e:
            return f"Error transferring call: {e}"


# ── Helpers ────────────────────────────────────────────────────────────────

def _is_sip_participant(room: rtc.Room) -> bool:
    for p in room.remote_participants.values():
        if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
            return True
    return False


def _get_caller_phone(room: rtc.Room) -> str | None:
    for p in room.remote_participants.values():
        if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
            return p.attributes.get("sip.phoneNumber") or p.attributes.get("sip.callID")
    return None


def _get_user_id_from_participant(participant: rtc.Participant) -> str | None:
    # 1. Attributes
    if participant.attributes:
        uid = participant.attributes.get("user_id") or participant.attributes.get("userId")
        if uid:
            return uid
    # 2. Metadata JSON
    if participant.metadata:
        try:
            meta = json.loads(participant.metadata)
            uid = meta.get("user_id") or meta.get("userId")
            if uid:
                return uid
        except json.JSONDecodeError:
            if len(participant.metadata) == 24:
                return participant.metadata
    # 3. Identity fallback
    if participant.identity and len(participant.identity) == 24:
        return participant.identity
    return None


# ── Agent Server ───────────────────────────────────────────────────────────

server = AgentServer()


@server.rtc_session(agent_name="career-counselor")
async def career_voice_agent(ctx: agents.JobContext):
    """Entry-point — handles both web and inbound phone calls."""
    await ctx.connect()

    participant = await ctx.wait_for_participant()
    is_phone_call = _is_sip_participant(ctx.room)
    caller_phone = _get_caller_phone(ctx.room) if is_phone_call else None

    user_data: dict | None = None
    career_roadmap: dict | None = None

    if is_phone_call and caller_phone:
        logger.info("Phone call from: %s", caller_phone)
        user_data = await _get_user_by_phone(caller_phone)
        if user_data:
            uid = user_data.get("_id") or str(user_data.get("id", ""))
            if uid:
                career_roadmap = await _get_career_roadmap(uid)
    else:
        logger.info("Web connection from: %s", participant.identity)
        uid = _get_user_id_from_participant(participant)
        if uid:
            user_data = await _get_user_by_id(uid)
            if user_data:
                career_roadmap = await _get_career_roadmap(uid)

    agent = CareerCounselor(
        ctx=ctx,
        is_phone_call=is_phone_call,
        user_data=user_data,
        career_roadmap=career_roadmap,
    )

    instructions = _build_instructions(user_data, career_roadmap, is_phone_call)

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Fenrir",
            temperature=0.8,
            instructions=instructions,
            language="en-US",
        ),
    )

    # Start session
    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(),
        ),
    )

    # Start Beyond Presence avatar for web sessions
    if not is_phone_call:
        bey_key = os.getenv("BEY_API_KEY")
        avatar_id = os.getenv("BEY_AVATAR_ID", "b9be11b8-89fb-4227-8f86-4a881393cbdb")
        if bey_key:
            try:
                avatar = bey.AvatarSession(avatar_id=avatar_id)
                await avatar.start(session, room=ctx.room)
                logger.info("Avatar started")
            except Exception as e:
                logger.warning("Avatar failed (continuing without): %s", e)

    await asyncio.sleep(2)

    # Graceful shutdown
    async def _on_shutdown():
        try:
            await session.drain()
        except Exception:
            pass
        try:
            await session.aclose()
        except Exception:
            pass
        try:
            lk = api.LiveKitAPI()
            await lk.room.delete_room(api.DeleteRoomRequest(room=ctx.room.name))
            await lk.aclose()
        except Exception:
            pass

    ctx.add_shutdown_callback(_on_shutdown)

    # Generate greeting
    if user_data and career_roadmap:
        name = user_data.get("name") or user_data.get("username") or "there"
        career_title = (career_roadmap.get("selected_career") or {}).get("title", "your chosen career")
        greeting = (
            f"Greet {name} by name warmly! Acknowledge that you remember their career path "
            f"towards {career_title}. Ask how their journey is going or if they have specific "
            f"questions about their roadmap. Keep it to 2-3 sentences."
        )
    elif user_data:
        name = user_data.get("name") or user_data.get("username") or "there"
        greeting = (
            f"Greet {name} by name warmly! Let them know they haven't created a career roadmap yet. "
            "Encourage them to use the platform's simulation feature. "
            "Ask what career questions they have today. Keep it to 2-3 sentences."
        )
    else:
        greeting = (
            "Greet the user warmly and introduce yourself as their career counselor from PrepX. "
            "Offer to help with general career questions and mention that for a personalised "
            "experience with a tailored career roadmap, they can use the Career Path Simulator. "
            "Keep it brief — 2-3 sentences."
        )

    for attempt in range(3):
        try:
            await session.generate_reply(instructions=greeting)
            break
        except Exception as e:
            if attempt < 2:
                logger.warning("generate_reply attempt %d failed: %s", attempt + 1, e)
                await asyncio.sleep(2)
            else:
                logger.error("generate_reply failed after 3 attempts: %s", e)


if __name__ == "__main__":
    agents.cli.run_app(server)
