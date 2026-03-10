"""
Interview feature routes — CRUD, LiveKit tokens, results, code execution.
"""

import json
import os
import time
import uuid
from datetime import datetime, timezone

import httpx
import jwt
from bson import ObjectId
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Cookie, Header
from fastapi.responses import JSONResponse
from livekit.api import AccessToken, VideoGrants, RoomAgentDispatch, RoomConfiguration

from src.db.mongodb import MongoDB
from src.config.settings import settings

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-to-a-strong-random-secret")


def _extract_user_id(
    token_cookie: str | None = None,
    authorization: str | None = None,
) -> str | None:
    """Pull user_id from JWT (cookie or Authorization header)."""
    raw: str | None = None
    if token_cookie:
        raw = token_cookie
    elif authorization and authorization.startswith("Bearer "):
        raw = authorization[7:]
    if not raw:
        return None
    try:
        payload = jwt.decode(raw, JWT_SECRET, algorithms=["HS256"])
        return payload.get("id") or payload.get("userId") or payload.get("_id")
    except Exception:
        return None
from src.models.interview import (
    ManualJDRequest,
    JobDetailsResponse,
    UpdateInterviewRequest,
    InterviewResponse,
    InterviewListItem,
    ConnectionDetailsRequest,
    RoomStatusResponse,
    ExecuteCodeRequest,
    ExecuteCodeResponse,
)
from src.services.interview.pdf_service import extract_text_from_pdf
from src.services.interview.groq_service import extract_job_details
from src.services.interview.coding_questions_service import get_random_question


def _validate_object_id(id_string: str, label: str = "ID") -> ObjectId:
    """Convert a string to ObjectId, raising HTTPException on invalid input."""
    try:
        return ObjectId(id_string)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")


# ═══════════════════════════════════════════════════════════════════════════
# Interview CRUD router
# ═══════════════════════════════════════════════════════════════════════════
interview_router = APIRouter(prefix="/api/interviews", tags=["interviews"])


async def _process_jd(jd_text: str, source: str, user_id: str | None = None) -> JobDetailsResponse:
    """Common logic: extract details via AI, save to MongoDB, return response."""
    try:
        job_details = await extract_job_details(jd_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")

    collection = MongoDB.get_collection("interviews")
    interview_doc = {
        "jd_source": source,
        "jd_text": jd_text,
        "job_details": job_details.model_dump(),
        "interview_context": None,
        "interview_settings": None,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    if user_id:
        interview_doc["user_id"] = user_id

    result = await collection.insert_one(interview_doc)

    return JobDetailsResponse(
        interview_id=str(result.inserted_id),
        jd_text=jd_text,
        job_details=job_details,
    )


@interview_router.get("/", response_model=list[InterviewListItem])
async def list_interviews(
    token: str | None = Cookie(None),
    authorization: str | None = Header(None),
):
    """Get all interviews for the dashboard (scoped to logged-in user)."""
    user_id = _extract_user_id(token, authorization)
    collection = MongoDB.get_collection("interviews")
    query = {"user_id": user_id} if user_id else {}
    cursor = collection.find(query).sort("created_at", -1)
    interviews = []

    async for doc in cursor:
        job_details = doc.get("job_details") or {}
        context = doc.get("interview_context") or {}
        interview_settings = doc.get("interview_settings") or {}

        interviews.append(InterviewListItem(
            id=str(doc["_id"]),
            job_title=job_details.get("job_title", "Untitled"),
            company=job_details.get("company", "—"),
            status=doc.get("status", "draft"),
            interview_mode=interview_settings.get("interview_mode", "3d-avatar"),
            avatar_model=interview_settings.get("avatar_model", "michael"),
            duration=interview_settings.get("duration", "30"),
            difficulty_level=context.get("difficulty_level", "medium"),
            created_at=doc.get("created_at", datetime.now(timezone.utc)).isoformat(),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)).isoformat(),
        ))

    return interviews


@interview_router.post("/upload-jd", response_model=JobDetailsResponse)
async def upload_jd(
    file: UploadFile = File(...),
    token: str | None = Cookie(None),
    authorization: str | None = Header(None),
):
    """Upload a PDF job description, extract text, parse with AI, save to DB."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    try:
        jd_text = extract_text_from_pdf(contents)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=422, detail="Failed to read the PDF file. It may be corrupted.")

    user_id = _extract_user_id(token, authorization)
    return await _process_jd(jd_text, source="pdf_upload", user_id=user_id)


@interview_router.post("/manual-jd", response_model=JobDetailsResponse)
async def manual_jd(
    request: ManualJDRequest,
    token: str | None = Cookie(None),
    authorization: str | None = Header(None),
):
    """Submit a manually written job description, parse with AI, save to DB."""
    user_id = _extract_user_id(token, authorization)
    return await _process_jd(request.jd_text, source="manual", user_id=user_id)


@interview_router.post("/{interview_id}/upload-resume", response_model=InterviewResponse)
async def upload_resume(interview_id: str, file: UploadFile = File(...)):
    """Upload a resume PDF, extract text, and store in the interview document."""
    collection = MongoDB.get_collection("interviews")

    obj_id = _validate_object_id(interview_id, "interview ID")

    existing = await collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")

    try:
        resume_text = extract_text_from_pdf(contents)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=422, detail="Failed to read the resume PDF.")

    context = existing.get("interview_context") or {}
    context["resume_text"] = resume_text
    context["resume_filename"] = file.filename

    await collection.update_one(
        {"_id": obj_id},
        {"$set": {"interview_context": context, "updated_at": datetime.now(timezone.utc)}},
    )

    return InterviewResponse(
        interview_id=interview_id,
        message=f"Resume parsed successfully ({len(resume_text)} characters extracted).",
    )


@interview_router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(interview_id: str, request: UpdateInterviewRequest):
    """Update an interview with job details, context, and settings (Steps 2-4)."""
    collection = MongoDB.get_collection("interviews")

    obj_id = _validate_object_id(interview_id, "interview ID")

    existing = await collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Interview not found.")

    update_data: dict = {"updated_at": datetime.now(timezone.utc)}

    if request.job_details is not None:
        update_data["job_details"] = request.job_details.model_dump()
    if request.interview_context is not None:
        ctx_data = request.interview_context.model_dump()
        existing_ctx = existing.get("interview_context") or {}
        if not ctx_data.get("resume_text") and existing_ctx.get("resume_text"):
            ctx_data["resume_text"] = existing_ctx["resume_text"]
            ctx_data["resume_filename"] = existing_ctx.get("resume_filename", "")
        update_data["interview_context"] = ctx_data
    if request.interview_settings is not None:
        update_data["interview_settings"] = request.interview_settings.model_dump()

    await collection.update_one({"_id": obj_id}, {"$set": update_data})

    return InterviewResponse(interview_id=interview_id, message="Interview updated successfully.")


@interview_router.post("/{interview_id}/publish", response_model=InterviewResponse)
async def publish_interview(interview_id: str):
    """Mark an interview as published."""
    collection = MongoDB.get_collection("interviews")

    obj_id = _validate_object_id(interview_id, "interview ID")

    existing = await collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Interview not found.")

    await collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": "published", "updated_at": datetime.now(timezone.utc)}},
    )

    return InterviewResponse(interview_id=interview_id, message="Interview published successfully!")


# ═══════════════════════════════════════════════════════════════════════════
# LiveKit connection & session router
# ═══════════════════════════════════════════════════════════════════════════
livekit_router = APIRouter(prefix="/api/livekit", tags=["livekit"])

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


@livekit_router.post("/connection-details", status_code=201)
async def connection_details(request: ConnectionDetailsRequest):
    """Standard LiveKit token endpoint.
    Returns { server_url, participant_token } following the LiveKit spec."""
    livekit_url = settings.livekit_url
    livekit_api_key = settings.livekit_api_key
    livekit_api_secret = settings.livekit_api_secret

    if not livekit_api_key or not livekit_api_secret or not livekit_url:
        raise HTTPException(status_code=500, detail="Server LiveKit configuration missing.")

    interview = None
    avatar_model = "michael"
    collection = MongoDB.get_collection("interviews")

    if request.interview_id:
        obj_id = _validate_object_id(request.interview_id, "interview ID")

        interview = await collection.find_one({"_id": obj_id})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")
        if interview.get("status") not in ("published", "in_progress"):
            raise HTTPException(
                status_code=400,
                detail=f"Interview is not ready. Current status: {interview.get('status', 'unknown')}",
            )
        i_settings = interview.get("interview_settings") or {}
        avatar_model = i_settings.get("avatar_model", "michael")

    # Room name
    room_name = request.room_name
    if not room_name:
        if request.interview_id:
            room_name = f"interview-{request.interview_id}-{uuid.uuid4().hex[:8]}"
        else:
            room_name = f"room-{int(time.time())}"

    participant_identity = request.participant_identity or f"candidate-{uuid.uuid4().hex[:6]}"
    participant_name = request.participant_name or "Candidate"

    token = (
        AccessToken(livekit_api_key, livekit_api_secret)
        .with_identity(participant_identity)
        .with_name(participant_name)
        .with_grants(VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        ))
    )

    if request.participant_metadata:
        token = token.with_metadata(request.participant_metadata)
    if request.participant_attributes:
        token = token.with_attributes(request.participant_attributes)

    if request.room_config:
        token = token.with_room_config(request.room_config)
    elif request.interview_id:
        agent_metadata = json.dumps({
            "interview_id": request.interview_id,
            "avatar_model": avatar_model,
        })
        token = token.with_room_config(
            RoomConfiguration(
                agents=[
                    RoomAgentDispatch(
                        agent_name="interview-agent",
                        metadata=agent_metadata,
                    )
                ],
            ),
        )

    participant_token = token.to_jwt()

    if interview and request.interview_id:
        await collection.update_one(
            {"_id": ObjectId(request.interview_id)},
            {
                "$set": {
                    "livekit_room": room_name,
                    "status": "in_progress",
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

    return JSONResponse(
        status_code=201,
        content={
            "server_url": livekit_url,
            "participant_token": participant_token,
            "room_name": room_name,
        },
    )


@livekit_router.get("/status/{interview_id}", response_model=RoomStatusResponse)
async def get_interview_room_status(interview_id: str):
    """Check the LiveKit room status for an interview."""
    collection = MongoDB.get_collection("interviews")

    obj_id = _validate_object_id(interview_id, "interview ID")

    interview = await collection.find_one({"_id": obj_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    return RoomStatusResponse(
        interview_id=interview_id,
        status=interview.get("status", "unknown"),
        room_name=interview.get("livekit_room"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# Results router
# ═══════════════════════════════════════════════════════════════════════════
results_router = APIRouter(prefix="/api/results", tags=["results"])


@results_router.get("/{interview_id}")
async def get_results(
    interview_id: str,
    token: str | None = Cookie(None),
    authorization: str | None = Header(None),
):
    """Get both precise and detailed results for an interview."""
    user_id = _extract_user_id(token, authorization)
    interviews_col = MongoDB.get_collection("interviews")
    collection = MongoDB.get_collection("results")

    obj_id = _validate_object_id(interview_id, "interview ID")

    # Verify ownership
    if user_id:
        interview = await interviews_col.find_one({"_id": obj_id, "user_id": user_id})
        if not interview:
            raise HTTPException(status_code=404, detail="Results not found for this interview.")

    result = await collection.find_one({"interview_id": interview_id})
    if not result:
        raise HTTPException(status_code=404, detail="Results not found for this interview.")

    return {
        "interview_id": result["interview_id"],
        "status": result.get("status", "completed"),
        "precise": result.get("precise"),
        "detailed": result.get("detailed"),
        "created_at": result.get("created_at", "").isoformat() if result.get("created_at") else None,
    }


@results_router.get("/{interview_id}/precise")
async def get_precise_results(interview_id: str):
    """Get only the precise (structured JSON) results."""
    collection = MongoDB.get_collection("results")

    _validate_object_id(interview_id, "interview ID")

    result = await collection.find_one(
        {"interview_id": interview_id},
        {"precise": 1, "interview_id": 1, "status": 1},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Results not found.")

    return {
        "interview_id": result["interview_id"],
        "status": result.get("status"),
        "precise": result.get("precise"),
    }


@results_router.get("/{interview_id}/detailed")
async def get_detailed_results(interview_id: str):
    """Get only the detailed (Markdown) results."""
    collection = MongoDB.get_collection("results")

    _validate_object_id(interview_id, "interview ID")

    result = await collection.find_one(
        {"interview_id": interview_id},
        {"detailed": 1, "interview_id": 1, "status": 1},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Results not found.")

    return {
        "interview_id": result["interview_id"],
        "status": result.get("status"),
        "detailed": result.get("detailed"),
    }


@results_router.get("/{interview_id}/status")
async def get_results_status(interview_id: str):
    """Check whether results exist (for polling from frontend)."""
    results_col = MongoDB.get_collection("results")
    interviews_col = MongoDB.get_collection("interviews")

    _validate_object_id(interview_id, "interview ID")

    result = await results_col.find_one(
        {"interview_id": interview_id},
        {"status": 1, "interview_id": 1},
    )

    if not result:
        interview = await interviews_col.find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")
        return {
            "interview_id": interview_id,
            "results_ready": False,
            "interview_status": interview.get("status", "unknown"),
        }

    return {
        "interview_id": interview_id,
        "results_ready": True,
        "status": result.get("status"),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Code execution & coding questions router
# ═══════════════════════════════════════════════════════════════════════════
code_router = APIRouter(prefix="/api/code", tags=["code"])

PISTON_URL = "https://emkc.org/api/v2/piston/execute"


@code_router.post("/execute", response_model=ExecuteCodeResponse)
async def execute_code(request: ExecuteCodeRequest):
    """Proxy code execution to the public Piston API."""
    payload = {
        "language": request.language,
        "version": request.version,
        "files": [{"content": request.code}],
        "stdin": request.stdin,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(PISTON_URL, json=payload)
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Piston API error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach code execution service: {str(e)}")

    data = resp.json()
    run = data.get("run", {})

    return ExecuteCodeResponse(
        stdout=run.get("stdout", ""),
        stderr=run.get("stderr", ""),
        exit_code=run.get("code", -1),
    )


@code_router.get("/questions")
async def fetch_coding_question(
    platform: str = Query("leetcode", pattern="^(leetcode|codeforces)$"),
    difficulty: str = Query("medium", pattern="^(easy|medium|hard|expert)$"),
):
    """Return a random coding question from *platform* at *difficulty*."""
    question = await get_random_question(platform=platform, difficulty=difficulty)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for {platform} at {difficulty} difficulty.",
        )
    return question
