import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import google, noise_cancellation, bey
from livekit.agents import BackgroundAudioPlayer, AudioConfig, BuiltinAudioClip

from tools import send_session_summary
from prompts import TUTOR_INSTRUCTIONS

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH, override=True)


class AITutor(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=TUTOR_INSTRUCTIONS,
            tools=[send_session_summary],
        )


async def entrypoint(ctx: agents.JobContext):
    load_dotenv(_ENV_PATH, override=True)

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Puck",
        ),
    )

    avatar = bey.AvatarSession(
        avatar_id=os.getenv("BEY_AVATAR_ID"),
        api_key=os.getenv("BEY_API_KEY"),
    )

    await avatar.start(session, room=ctx.room)

    await session.start(
        room=ctx.room,
        agent=AITutor(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
            video_enabled=True,
        ),
    )

    background_audio = BackgroundAudioPlayer(
        thinking_sound=[
            AudioConfig(BuiltinAudioClip.KEYBOARD_TYPING, volume=1),
            AudioConfig(BuiltinAudioClip.KEYBOARD_TYPING2, volume=1),
        ],
    )
    await background_audio.start(room=ctx.room, agent_session=session)

    await session.generate_reply(
        instructions="Greet the user warmly and introduce yourself as their AI Tutor. "
        "Let them know you can help explain code, PDFs, and any educational content "
        "they share on screen. Ask what they'd like to learn today.",
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
