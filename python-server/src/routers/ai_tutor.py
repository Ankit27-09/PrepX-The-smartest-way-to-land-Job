"""AI Tutor – LiveKit token generation endpoint."""

import os
import random
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from livekit.api import AccessToken, VideoGrants

# Ensure .env is loaded
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env", override=True)


router = APIRouter(prefix="/api/ai-tutor", tags=["ai-tutor"])


@router.get("/connection-details")
async def get_connection_details():
    """Generate a LiveKit room token for an AI Tutor session."""
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not all([livekit_url, api_key, api_secret]):
        raise HTTPException(
            status_code=500,
            detail="LiveKit credentials are not configured on the server.",
        )

    participant_identity = f"tutor_user_{random.randint(1000, 9999)}"
    participant_name = "Learner"
    room_name = f"ai_tutor_room_{random.randint(1000, 9999)}"

    token = (
        AccessToken(api_key, api_secret)
        .with_identity(participant_identity)
        .with_name(participant_name)
        .with_ttl(timedelta(minutes=15))
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
    )

    return {
        "serverUrl": livekit_url,
        "roomName": room_name,
        "participantName": participant_name,
        "participantToken": token.to_jwt(),
    }
