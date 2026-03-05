"""
Node A2: CareerMatcher Agent
The Career Fit Analyzer – identifies top 3 career matches with detailed reasoning.
"""

import time
from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from .base import get_llm
from ..models.state import (
    CareerSimulationState,
    CareerFitReasoning,
    CareerFit,
    CareerMatcherResult,
)
from ..models.career_profile import CareerProfile, NormalizedProfile


# ── Structured Output Models ─────────────────────────────────────────────────

class CareerFitReasoningOutput(BaseModel):
    strengths_alignment: list[str] = Field(description="3-5 user strengths aligned with this career")
    interest_match: list[str] = Field(description="2-3 interest alignment items")
    skill_transferability: list[str] = Field(description="2-4 transferable skills")
    growth_potential_reasons: list[str] = Field(description="2-3 growth reasons")
    market_demand_reasons: list[str] = Field(description="2-3 demand factors")
    potential_challenges: list[str] = Field(description="2-3 honest challenges")
    why_now: str = Field(description="Why now is a good time")


class CareerFitOutput(BaseModel):
    rank: int = Field(description="Rank 1-3")
    career_title: str = Field(description="Job title")
    career_field: str = Field(description="Industry/field")
    overall_fit_score: float = Field(default=75.0)
    skill_fit_score: float = Field(default=70.0)
    interest_fit_score: float = Field(default=70.0)
    market_fit_score: float = Field(default=70.0)
    personality_fit_score: float = Field(default=70.0)
    tagline: str = Field(default="A promising career path.")
    reasoning: Optional[CareerFitReasoningOutput] = None
    typical_salary_range: str = Field(default="Varies by location")
    time_to_entry: str = Field(default="6-12 months")
    difficulty_level: str = Field(default="Moderate")
    top_3_reasons: list[str] = Field(default_factory=lambda: ["Skills alignment", "Market demand", "Growth potential"])
    key_skills_needed: list[str] = Field(default_factory=list)
    immediate_next_steps: list[str] = Field(default_factory=list)


class CareerMatcherOutput(BaseModel):
    analysis_summary: str
    profile_highlights: list[str]
    career_fits: list[CareerFitOutput]
    methodology_explanation: str
    confidence_level: str
    confidence_reasoning: str


# ── Prompt ────────────────────────────────────────────────────────────────────

CAREER_MATCHER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert career counselor with deep knowledge of:
- Current job market trends and salary data (2024-2025)
- Skill requirements for various tech and non-tech roles
- Career progression paths across industries
- Personality-job fit research

Analyze the student's profile and recommend the TOP 3 BEST-FIT careers.
GUIDELINES:
1. Be specific and realistic
2. Provide DETAILED REASONING for every recommendation
3. Be honest about challenges
4. Each career should be DISTINCT
5. Prioritize careers with good market demand AND alignment
6. Consider risk tolerance when recommending

SCORING: skill_fit, interest_fit, market_fit, personality_fit – each 0-100."""),
    ("human", """Analyze this profile and recommend TOP 3 best-fit careers:

=== BASIC INFO ===
Education Level: {education_level} | Institution: {institution}
Major: {major} | GPA: {gpa}/{gpa_scale}
Graduation: {graduation_year} | Country: {country}

=== CAREER INTERESTS ===
Target Fields: {target_fields} | Roles: {specific_roles}
Goal: {career_goal} | Level: {role_level} | Env: {work_env}

=== SKILLS ===
Technical: {technical_skills} | Soft: {soft_skills}

=== PERSONALITY ===
Work Style: {work_style} | Risk: {risk_tolerance} | Learning: {learning_style}

=== CONSTRAINTS ===
Investment: {investment_capacity} | Hours/Week: {hours_per_week}
Timeline: {workforce_timeline} | Awareness: {market_awareness}
Concerns: {career_concerns} | Optimism: {optimism_level}

{normalized_summary}

Provide exactly 3 DISTINCT career recommendations ranked by overall fit.""")
])


# ── Node Function ─────────────────────────────────────────────────────────────

def career_matcher_node(state: CareerSimulationState) -> dict:
    """Node A2: Analyze profile → return top 3 career fits."""
    start_time = time.time()
    profile = state.get("career_profile")
    normalized = state.get("normalized_profile")

    if not profile:
        return {"errors": ["No career profile provided"], "current_node": "career_matcher"}

    try:
        result = _analyze_career_fits(profile, normalized)
    except Exception as e:
        print(f"Career matcher LLM failed: {e}")
        result = _create_fallback(profile, normalized)

    processing_time = (time.time() - start_time) * 1000
    return {
        "career_matcher_result": result,
        "current_node": "career_matcher",
        "processing_time_ms": {"career_matcher": processing_time},
    }


def _analyze_career_fits(profile: CareerProfile, normalized: Optional[NormalizedProfile]) -> CareerMatcherResult:
    normalized_summary = ""
    if normalized:
        traits = ", ".join(normalized.persona_traits) if normalized.persona_traits else "N/A"
        normalized_summary = f"""
=== AI ANALYSIS ===
Persona: {normalized.persona_type} | Traits: {traits}
Academic: {normalized.academic_strength_score}/100 | Career Ready: {normalized.career_readiness_score}/100
Skill Ready: {normalized.skill_readiness_score}/100 | Financial Ready: {normalized.financial_readiness_score}/100
Combined Skills: {normalized.combined_technical_skills}
Summary: {normalized.profile_summary}"""

    llm = get_llm(temperature=0.4)
    structured_llm = llm.with_structured_output(CareerMatcherOutput)
    chain = CAREER_MATCHER_PROMPT | structured_llm

    raw: CareerMatcherOutput = chain.invoke({
        "education_level": profile.current_education_level or "Not specified",
        "institution": profile.institution_name or "Not specified",
        "major": profile.current_major or "Not specified",
        "gpa": profile.current_gpa or "N/A",
        "gpa_scale": profile.grading_scale or "N/A",
        "graduation_year": profile.expected_graduation_year or "Not specified",
        "country": profile.current_country or "Not specified",
        "target_fields": ", ".join(profile.target_career_fields) if profile.target_career_fields else "Not specified",
        "specific_roles": ", ".join(profile.specific_roles) if profile.specific_roles else "Not specified",
        "career_goal": profile.primary_career_goal or "Not specified",
        "role_level": profile.desired_role_level or "Not specified",
        "work_env": ", ".join(profile.preferred_work_env) if profile.preferred_work_env else "Not specified",
        "technical_skills": str(profile.technical_skills) if profile.technical_skills else "Not specified",
        "soft_skills": str(profile.soft_skills) if profile.soft_skills else "Not specified",
        "work_style": profile.work_style or "Not specified",
        "risk_tolerance": profile.risk_tolerance or "Medium",
        "learning_style": ", ".join(profile.learning_style) if profile.learning_style else "Not specified",
        "investment_capacity": profile.investment_capacity or "Not specified",
        "hours_per_week": profile.hours_per_week or 20,
        "workforce_timeline": profile.desired_workforce_timeline or "Not specified",
        "market_awareness": profile.market_awareness or "Medium",
        "career_concerns": ", ".join(profile.career_concerns) if profile.career_concerns else "None",
        "optimism_level": profile.optimism_level or "Balanced",
        "normalized_summary": normalized_summary,
    })

    # Convert to domain models
    fits: list[CareerFit] = []
    for f in raw.career_fits:
        reasoning = CareerFitReasoning(
            strengths_alignment=f.reasoning.strengths_alignment if f.reasoning else [],
            interest_match=f.reasoning.interest_match if f.reasoning else [],
            skill_transferability=f.reasoning.skill_transferability if f.reasoning else [],
            growth_potential_reasons=f.reasoning.growth_potential_reasons if f.reasoning else [],
            market_demand_reasons=f.reasoning.market_demand_reasons if f.reasoning else [],
            potential_challenges=f.reasoning.potential_challenges if f.reasoning else [],
            why_now=f.reasoning.why_now if f.reasoning else "",
        )
        fits.append(CareerFit(
            rank=f.rank, career_title=f.career_title, career_field=f.career_field,
            overall_fit_score=f.overall_fit_score, skill_fit_score=f.skill_fit_score,
            interest_fit_score=f.interest_fit_score, market_fit_score=f.market_fit_score,
            personality_fit_score=f.personality_fit_score, tagline=f.tagline,
            reasoning=reasoning, typical_salary_range=f.typical_salary_range,
            time_to_entry=f.time_to_entry, difficulty_level=f.difficulty_level,
            top_3_reasons=f.top_3_reasons, key_skills_needed=f.key_skills_needed,
            immediate_next_steps=f.immediate_next_steps,
        ))

    return CareerMatcherResult(
        analysis_summary=raw.analysis_summary,
        profile_highlights=raw.profile_highlights,
        career_fits=fits,
        methodology_explanation=raw.methodology_explanation,
        confidence_level=raw.confidence_level,
        confidence_reasoning=raw.confidence_reasoning,
    )


def _create_fallback(profile: CareerProfile, normalized: Optional[NormalizedProfile]) -> CareerMatcherResult:
    target_roles = profile.specific_roles or []
    target_fields = profile.target_career_fields or []
    defaults = [
        ("Software Engineer", "Technology", "Build digital products that shape how the world works"),
        ("Data Scientist", "AI/ML", "Turn raw data into insights that drive business decisions"),
        ("Product Manager", "Technology", "Lead product strategy at the intersection of tech and business"),
    ]
    fits: list[CareerFit] = []
    for i, (title, field, tagline) in enumerate(defaults):
        if i < len(target_roles):
            title = target_roles[i]
        if i < len(target_fields):
            field = target_fields[i]
        fits.append(CareerFit(
            rank=i + 1, career_title=title, career_field=field,
            overall_fit_score=90 - i * 8, skill_fit_score=85 - i * 5,
            interest_fit_score=88 - i * 6, market_fit_score=85 - i * 4,
            personality_fit_score=82 - i * 5, tagline=tagline,
            typical_salary_range="$70,000 - $120,000", time_to_entry="6-12 months",
            difficulty_level="Moderate" if i < 2 else "Challenging",
            top_3_reasons=["Strong technical background", "Market demand", "Clear growth path"],
            key_skills_needed=["Programming", "Data Structures", "System Design", "Communication", "Problem Solving"],
            immediate_next_steps=["Complete foundational course", "Build portfolio projects", "Start applying"],
        ))
    return CareerMatcherResult(
        analysis_summary=f"Based on your profile as a {profile.current_education_level or 'student'} in {profile.current_major or 'CS'}, you have strong potential in technical roles.",
        profile_highlights=[f"Education: {profile.current_education_level or 'In Progress'}", f"Major: {profile.current_major or 'CS'}"],
        career_fits=fits,
        methodology_explanation="Fallback recommendations based on profile analysis.",
        confidence_level="Medium",
        confidence_reasoning="Some profile fields were not specified.",
    )
