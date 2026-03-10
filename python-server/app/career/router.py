"""
Career Path Simulator — FastAPI Router
Two-stage flow:
  POST /api/career/analyze          → Stage 1 (returns 3 career fits)
  POST /api/career/simulate/selected → Stage 2 (full simulation for chosen career)
  GET  /api/career/health           → Health check
"""

import os
import time
import tempfile
import logging
from datetime import datetime, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Cookie, Header, HTTPException, Request, UploadFile, File
from pydantic import BaseModel

from src.db.mongodb import MongoDB
from .graph import (
    run_career_matching_async,
    run_career_simulation_for_selected_async,
)

logger = logging.getLogger("career-router")

router = APIRouter(prefix="/api/career", tags=["career"])

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-to-a-strong-random-secret")

# ─── In-memory session store (swap with Redis in production) ─────────────────
_session_store: dict[str, dict] = {}


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
    except jwt.PyJWTError:
        return None


# ─── Request / Response schemas ──────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Profile data sent from the frontend."""
    profile: dict


class CareerFitReasoningResponse(BaseModel):
    strengths_alignment: list[str] = []
    interest_match: list[str] = []
    skill_transferability: list[str] = []
    growth_potential_reasons: list[str] = []
    market_demand_reasons: list[str] = []
    potential_challenges: list[str] = []
    why_now: str = ""


class CareerFitResponse(BaseModel):
    rank: int
    career_title: str
    career_field: str
    overall_fit_score: float
    skill_fit_score: float
    interest_fit_score: float
    market_fit_score: float
    personality_fit_score: float
    tagline: str
    reasoning: CareerFitReasoningResponse
    typical_salary_range: str
    time_to_entry: str
    difficulty_level: str
    top_3_reasons: list[str]
    key_skills_needed: list[str]
    immediate_next_steps: list[str]


class CareerMatchingResponse(BaseModel):
    success: bool
    session_id: str
    processing_time_ms: float
    analysis_summary: str
    profile_highlights: list[str]
    career_fits: list[CareerFitResponse]
    methodology_explanation: str
    confidence_level: str
    confidence_reasoning: str
    errors: list[str] = []


class SelectCareerRequest(BaseModel):
    session_id: str
    career_index: int  # 0, 1, or 2


class SimulationResponse(BaseModel):
    success: bool
    simulation_id: str
    processing_time_ms: float
    summary: dict
    dashboard_data: Optional[dict] = None
    timeline: Optional[dict] = None
    financial_analysis: Optional[dict] = None
    risk_assessment: Optional[dict] = None
    gap_analysis: Optional[dict] = None
    warnings: list[str] = []
    errors: list[str] = []


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/health")
async def career_health():
    return {
        "status": "healthy",
        "service": "Career Path Simulator",
        "agents": [
            "ProfileParser",
            "CareerMatcher",
            "MarketScout",
            "GapAnalyst",
            "TimelineSimulator",
            "FinancialAdvisor",
            "RiskAssessor",
            "DashboardFormatter",
        ],
    }


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Extract text from an uploaded resume PDF and return it."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    try:
        from langchain_community.document_loaders import PyPDFLoader

        content = await file.read()

        # Write to a temp file so PyPDFLoader can read it
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.write(content)
        tmp.close()

        docs = PyPDFLoader(tmp.name).load()
        text = "\n".join(d.page_content for d in docs)

        os.unlink(tmp.name)

        if not text.strip():
            raise HTTPException(422, "Could not extract text from the PDF")

        return {
            "success": True,
            "resume_text": text.strip(),
            "filename": file.filename,
            "page_count": len(docs),
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Resume processing failed: {exc}")


@router.post("/analyze", response_model=CareerMatchingResponse)
async def analyze_career_fits(request: AnalyzeRequest):
    """Stage 1: Analyze the profile and return top 3 career fits."""
    start = time.time()

    try:
        result = await run_career_matching_async(request.profile)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Career analysis failed: {exc}")

    elapsed_ms = (time.time() - start) * 1000

    matcher_result = result.get("career_matcher_result")
    if not matcher_result:
        raise HTTPException(status_code=500, detail="Career matching produced no results")

    # Persist state for Stage 2
    session_id = f"session_{int(time.time())}_{id(result) % 10000}"
    _session_store[session_id] = {
        "state": result,
        "profile": request.profile,
        "created_at": time.time(),
    }

    # Build response
    fits: list[CareerFitResponse] = []
    for fit in matcher_result.career_fits:
        fits.append(
            CareerFitResponse(
                rank=fit.rank,
                career_title=fit.career_title,
                career_field=fit.career_field,
                overall_fit_score=fit.overall_fit_score,
                skill_fit_score=fit.skill_fit_score,
                interest_fit_score=fit.interest_fit_score,
                market_fit_score=fit.market_fit_score,
                personality_fit_score=fit.personality_fit_score,
                tagline=fit.tagline,
                reasoning=CareerFitReasoningResponse(
                    strengths_alignment=fit.reasoning.strengths_alignment,
                    interest_match=fit.reasoning.interest_match,
                    skill_transferability=fit.reasoning.skill_transferability,
                    growth_potential_reasons=fit.reasoning.growth_potential_reasons,
                    market_demand_reasons=fit.reasoning.market_demand_reasons,
                    potential_challenges=fit.reasoning.potential_challenges,
                    why_now=fit.reasoning.why_now,
                ),
                typical_salary_range=fit.typical_salary_range,
                time_to_entry=fit.time_to_entry,
                difficulty_level=fit.difficulty_level,
                top_3_reasons=fit.top_3_reasons,
                key_skills_needed=fit.key_skills_needed,
                immediate_next_steps=fit.immediate_next_steps,
            )
        )

    return CareerMatchingResponse(
        success=True,
        session_id=session_id,
        processing_time_ms=elapsed_ms,
        analysis_summary=matcher_result.analysis_summary,
        profile_highlights=matcher_result.profile_highlights,
        career_fits=fits,
        methodology_explanation=matcher_result.methodology_explanation,
        confidence_level=matcher_result.confidence_level,
        confidence_reasoning=matcher_result.confidence_reasoning,
        errors=result.get("errors", []),
    )


@router.post("/simulate/selected", response_model=SimulationResponse)
async def simulate_selected_career(
    request: SelectCareerRequest,
    token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
):
    """Stage 2: Run the full simulation for the career the user selected."""
    start = time.time()

    session = _session_store.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Run /analyze first.")

    if request.career_index < 0 or request.career_index > 2:
        raise HTTPException(status_code=400, detail="career_index must be 0, 1, or 2")

    try:
        result = await run_career_simulation_for_selected_async(
            session["state"], request.career_index
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}")

    elapsed_ms = (time.time() - start) * 1000

    # Clean up session
    _session_store.pop(request.session_id, None)

    dashboard_data = result.get("dashboard_data")
    financial = result.get("financial_analysis")
    risk = result.get("risk_assessment")
    gap = result.get("gap_analysis")

    summary = _extract_summary(result)
    timeline = _extract_timeline(result)

    response = SimulationResponse(
        success=True,
        simulation_id=f"sim_{int(time.time())}",
        processing_time_ms=elapsed_ms,
        summary=summary,
        dashboard_data=dashboard_data.model_dump() if dashboard_data else None,
        timeline=timeline,
        financial_analysis=financial.model_dump() if financial else None,
        risk_assessment=risk.model_dump() if risk else None,
        gap_analysis=gap.model_dump() if gap else None,
        warnings=result.get("warnings", []),
        errors=result.get("errors", []),
    )

    # ── Save to MongoDB if user is authenticated ────────────────────────
    user_id = _extract_user_id(token, authorization)
    if user_id:
        try:
            col = MongoDB.get_collection("career_roadmaps")
            roadmap_doc = {
                "user_id": user_id,
                "simulation_id": response.simulation_id,
                "selected_career": summary.get("selected_career"),
                "summary": summary,
                "dashboard_data": response.dashboard_data,
                "timeline": response.timeline,
                "financial_analysis": response.financial_analysis,
                "risk_assessment": response.risk_assessment,
                "gap_analysis": response.gap_analysis,
                "warnings": response.warnings,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            # Upsert — one roadmap per user (latest simulation wins)
            await col.update_one(
                {"user_id": user_id},
                {"$set": roadmap_doc},
                upsert=True,
            )
            logger.info("Saved career roadmap for user %s", user_id)
        except Exception as e:
            logger.warning("Failed to save career roadmap: %s", e)

    return response


@router.get("/roadmap")
async def get_saved_roadmap(
    token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
):
    """Return the user's saved career roadmap from MongoDB (if any)."""
    user_id = _extract_user_id(token, authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    col = MongoDB.get_collection("career_roadmaps")
    doc = await col.find_one({"user_id": user_id})
    if not doc:
        return {"found": False}

    doc["_id"] = str(doc["_id"])
    if "created_at" in doc:
        doc["created_at"] = doc["created_at"].isoformat()
    if "updated_at" in doc:
        doc["updated_at"] = doc["updated_at"].isoformat()
    return {"found": True, "roadmap": doc}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _extract_summary(result: dict) -> dict:
    summary: dict = {}

    normalized_profile = result.get("normalized_profile")
    if normalized_profile:
        summary["persona"] = normalized_profile.persona_type
        summary["academic_score"] = normalized_profile.academic_strength_score
        summary["readiness_scores"] = {
            "career": normalized_profile.career_readiness_score,
            "skill": normalized_profile.skill_readiness_score,
            "financial": normalized_profile.financial_readiness_score,
        }

    gap_analysis = result.get("gap_analysis")
    if gap_analysis:
        summary["gap_score"] = gap_analysis.overall_gap_score
        summary["gap_category"] = gap_analysis.gap_category

    risk_assessment = result.get("risk_assessment")
    if risk_assessment:
        summary["success_probability"] = risk_assessment.success_probability_score
        summary["confidence_interval"] = risk_assessment.confidence_interval

    financial_analysis = result.get("financial_analysis")
    if financial_analysis:
        summary["total_investment"] = financial_analysis.total_investment_required
        summary["break_even_year"] = financial_analysis.break_even_year
        summary["roi_5_year"] = financial_analysis.five_year_roi

    timeline_simulation = result.get("timeline_simulation")
    if timeline_simulation:
        summary["recommended_path"] = timeline_simulation.recommended_path
        if timeline_simulation.realistic_path:
            summary["timeline_years"] = timeline_simulation.realistic_path.total_years
            summary["target_role"] = timeline_simulation.realistic_path.final_target_role

    selected = result.get("selected_career")
    if selected:
        summary["selected_career"] = {
            "title": selected.career_title,
            "field": selected.career_field,
            "fit_score": selected.overall_fit_score,
            "tagline": getattr(selected, "tagline", ""),
            "difficulty_level": getattr(selected, "difficulty_level", ""),
            "time_to_entry": getattr(selected, "time_to_entry", ""),
            "typical_salary_range": getattr(selected, "typical_salary_range", ""),
        }

    return summary


def _extract_timeline(result: dict) -> dict | None:
    timeline = result.get("timeline_simulation")
    if not timeline:
        return None
    return {
        "recommended_path": timeline.recommended_path,
        "recommendation_reason": timeline.recommendation_reason,
        "alignment_score": timeline.alignment_score,
        "vibe_check_warnings": timeline.vibe_check_warnings,
        "conservative_path": (
            timeline.conservative_path.model_dump() if timeline.conservative_path else None
        ),
        "realistic_path": (
            timeline.realistic_path.model_dump() if timeline.realistic_path else None
        ),
        "ambitious_path": (
            timeline.ambitious_path.model_dump() if timeline.ambitious_path else None
        ),
    }
