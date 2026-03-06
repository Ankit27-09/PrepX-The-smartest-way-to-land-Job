from dotenv import load_dotenv
from pathlib import Path

from livekit import agents
from livekit.agents import AgentSession, Agent, room_io
from livekit.plugins import google, silero, bey, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from tools import send_session_summary
from prompts import TUTOR_INSTRUCTIONS
import os
from livekit.agents import BackgroundAudioPlayer, AudioConfig, BuiltinAudioClip

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
        stt="deepgram/nova-3",
        llm=google.LLM(model="gemini-2.5-flash"),
        tts="cartesia/sonic-3",
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
        preemptive_generation=True,
    )

    avatar = bey.AvatarSession(
        avatar_id=os.getenv("BEY_AVATAR_ID"),
        api_key=os.getenv("BEY_API_KEY"),
    )

    await avatar.start(session, room=ctx.room)

    await session.start(
        room=ctx.room,
        agent=AITutor(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
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
