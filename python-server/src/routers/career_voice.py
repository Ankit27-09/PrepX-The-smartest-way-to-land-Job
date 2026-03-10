"""Career Voice Agent – LiveKit token generation & room dispatch."""

import os
import random
from datetime import timedelta
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Header, HTTPException, Request
from livekit.api import AccessToken, VideoGrants, RoomConfiguration, RoomAgentDispatch

# Load .env
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env", override=True)

# Also load agents/.env for LiveKit creds
_AGENTS_ENV = Path(__file__).resolve().parent.parent.parent.parent / "agents" / ".env"
load_dotenv(_AGENTS_ENV, override=True)

router = APIRouter(prefix="/api/career/voice", tags=["career-voice"])

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-to-a-strong-random-secret")


def _extract_user_id(
    token_cookie: str | None = None,
    authorization: str | None = None,
) -> str | None:
    """Pull user_id from JWT (cookie or Authorization header)."""
    raw_token: str | None = None

    if token_cookie:
        raw_token = token_cookie
    elif authorization and authorization.startswith("Bearer "):
        raw_token = authorization[7:]

    if not raw_token:
        return None

    try:
        payload = jwt.decode(raw_token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("id") or payload.get("userId") or payload.get("_id")
    except jwt.PyJWTError:
        return None


@router.post("/connection-details")
async def get_voice_connection_details(
    request: Request,
    token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
):
    """Generate a LiveKit token for the Career Counselor voice agent."""
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not all([livekit_url, api_key, api_secret]):
        raise HTTPException(status_code=500, detail="LiveKit credentials are not configured.")

    user_id = _extract_user_id(token, authorization)
    participant_identity = f"career_user_{user_id or random.randint(1000, 9999)}"
    participant_name = "Career User"
    room_name = f"career_voice_{random.randint(10000, 99999)}"

    access_token = (
        AccessToken(api_key, api_secret)
        .with_identity(participant_identity)
        .with_name(participant_name)
        .with_ttl(timedelta(minutes=30))
        .with_grants(
            VideoGrants(
                room=room_name,
                room_join=True,
                can_publish=True,
                can_publish_data=True,
                can_subscribe=True,
                can_update_own_metadata=True,
            )
        )
        .with_room_config(
            RoomConfiguration(
                agents=[
                    RoomAgentDispatch(agent_name="career-counselor"),
                ],
            )
        )
    )

    if user_id:
        access_token = access_token.with_attributes({"user_id": user_id})

    return {
        "serverUrl": livekit_url,
        "roomName": room_name,
        "participantName": participant_name,
        "participantToken": access_token.to_jwt(),
    }
