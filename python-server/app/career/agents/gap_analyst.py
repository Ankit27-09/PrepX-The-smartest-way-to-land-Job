"""
Node C: GapAnalyst Agent
The Diagnostic Engine – Compares user profile vs market requirements.
Uses structured output for reliable data extraction.
"""

import time
from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from ..models.state import CareerSimulationState, GapAnalysis, SkillGap
from .base import get_llm


# ── Structured output models ─────────────────────────────────────────────────

class SkillGapOutput(BaseModel):
    skill_name: str = Field(description="Name of the skill")
    current_level: str = Field(description="Current proficiency: None, Basic, Intermediate, Advanced, Expert")
    required_level: str = Field(description="Required proficiency for the target role")
    gap_severity: float = Field(description="Gap severity score 0-100")
    estimated_time_to_close: str = Field(description="e.g. '3 months', '6 months'")
    recommended_resources: list[str] = Field(default_factory=list, description="2-3 courses / certs / resources")
    reasoning: str = Field(default="", description="Why this gap exists and matters")
    priority: str = Field(default="medium", description="critical, high, medium, low")
    learning_path: list[str] = Field(default_factory=list, description="3-5 sequential learning steps")


class GapAnalysisOutput(BaseModel):
    overall_gap_score: float = Field(description="Overall gap score 0-100")
    gap_category: str = Field(description="minimal, manageable, significant, severe")
    analysis_reasoning: str = Field(description="Detailed reasoning for the overall gap assessment")

    technical_skill_gaps: list[SkillGapOutput] = Field(description="4-6 technical skill gaps")
    soft_skill_gaps: list[SkillGapOutput] = Field(description="2-4 soft skill gaps")

    education_gap: Optional[str] = Field(default=None, description="Education gap if any")
    education_gap_reasoning: str = Field(default="")
    certification_gaps: list[str] = Field(default_factory=list)
    experience_gap_years: float = Field(default=0)
    experience_gap_reasoning: str = Field(default="")

    critical_bottlenecks: list[str] = Field(description="2-4 critical blockers")
    timeline_bottlenecks: list[str] = Field(description="2-3 timeline-extending issues")
    existing_strengths: list[str] = Field(description="3-5 existing strengths")
    competitive_advantages: list[str] = Field(description="2-4 competitive advantages")

    personality_frictions: list[str] = Field(default_factory=list)
    stress_risks: list[str] = Field(default_factory=list)
    top_priorities: list[str] = Field(default_factory=list, description="Top 3-5 priorities")
    quick_wins: list[str] = Field(default_factory=list, description="2-3 quick wins achievable in 2 weeks")


# ── Prompt ────────────────────────────────────────────────────────────────────

GAP_ANALYSIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert career gap analyst. Compare the candidate's current profile against market requirements and identify ALL gaps comprehensively.

Provide detailed analysis WITH REASONING for:
1. Technical Skill Gaps (4-6): specific skills, levels, severity, resources, priority, learning_path
2. Soft Skill Gaps (2-4): communication, leadership, etc.
3. Education & Certification Gaps
4. Critical Bottlenecks (2-4)
5. Timeline Bottlenecks (2-3)
6. Existing Strengths (3-5)
7. Competitive Advantages (2-4)
8. Top Priorities (3-5)
9. Quick Wins (2-3)

Be thorough, specific, and constructive. NEVER leave arrays empty."""),

    ("human", """Perform a comprehensive gap analysis:

**CANDIDATE PROFILE:**
{profile_summary}

**Resume Context:** {resume_context}

**Academic Details:**
- Academic Strength: {academic_score}/100
- Normalized GPA: {gpa}/100
- Institution: {institution}
- Years to Graduation: {years_to_grad}

**Current Skills:**
- Technical: {tech_skills}
- Soft: {soft_skills}

**Psychometrics:**
- Work Preference: {work_preference}
- Work Style: {work_style}
- Role Preference: {role_preference}
- Risk Tolerance: {risk_tolerance}

**TARGET ROLES:** {target_roles}

**MARKET REQUIREMENTS:**
{market_requirements}

**MARKET CONDITIONS:**
- Demand: {demand_level} | Competition: {competition_level} | Education: {required_education}

Provide a complete gap analysis with detailed reasoning.""")
])


# ── Node ──────────────────────────────────────────────────────────────────────

def gap_analyst_node(state: CareerSimulationState) -> dict:
    """Node C: GapAnalyst – compare user profile vs market requirements."""
    start_time = time.time()

    normalized = state.get("normalized_profile")
    market = state.get("market_insights")
    profile = state["career_profile"]

    market_requirements = _format_market_requirements(market)
    target_roles = ", ".join(profile.specific_roles) if profile.specific_roles else "Software Engineer"

    demand_level = "Medium"
    competition_level = "Medium"
    required_education = "Bachelor's"
    if market and market.target_roles:
        pr = market.target_roles[0]
        demand_level, competition_level = pr.demand_level, pr.competition_level
        required_education = pr.min_education or "Bachelor's"

    resume_context = profile.resume_text if hasattr(profile, "resume_text") and profile.resume_text else "No resume provided"

    llm = get_llm(temperature=0.3)

    try:
        structured_llm = llm.with_structured_output(GapAnalysisOutput)
        chain = GAP_ANALYSIS_PROMPT | structured_llm
        output: GapAnalysisOutput = chain.invoke({
            "profile_summary": normalized.profile_summary if normalized else "Profile not available",
            "resume_context": resume_context,
            "academic_score": round(normalized.academic_strength_score, 1) if normalized else 50,
            "gpa": round(normalized.normalized_gpa, 1) if normalized else 50,
            "tech_skills": str(normalized.combined_technical_skills) if normalized else "Not assessed",
            "soft_skills": str(profile.soft_skills) if profile.soft_skills else "Not assessed",
            "institution": profile.institution_name or "Not specified",
            "years_to_grad": normalized.years_to_graduation if normalized else "Unknown",
            "work_preference": profile.work_preference or "Not specified",
            "work_style": profile.work_style or "Not specified",
            "role_preference": profile.role_preference or "Not specified",
            "risk_tolerance": profile.risk_tolerance or "Medium",
            "target_roles": target_roles,
            "market_requirements": market_requirements,
            "demand_level": demand_level,
            "competition_level": competition_level,
            "required_education": required_education,
        })
        gap_analysis = _convert_to_gap_analysis(output)
    except Exception as e:
        print(f"Structured output failed, using fallback: {e}")
        gap_analysis = _create_fallback_gap_analysis(profile, normalized, market, target_roles)

    # Vibe check for psychometric mismatches
    vibe = _perform_vibe_check(profile, market)
    gap_analysis.personality_frictions.extend(vibe["frictions"])
    gap_analysis.stress_risks.extend(vibe["stress_risks"])

    should_suggest_alternatives = gap_analysis.overall_gap_score > 80
    processing_time = (time.time() - start_time) * 1000

    return {
        "gap_analysis": gap_analysis,
        "should_suggest_alternatives": should_suggest_alternatives,
        "current_node": "gap_analyst",
        "processing_time_ms": {"gap_analyst": processing_time},
    }


# ── Converters ────────────────────────────────────────────────────────────────

def _convert_to_gap_analysis(output: GapAnalysisOutput) -> GapAnalysis:
    ga = GapAnalysis(
        overall_gap_score=output.overall_gap_score,
        gap_category=output.gap_category,
        analysis_reasoning=output.analysis_reasoning,
        education_gap=output.education_gap,
        education_gap_reasoning=output.education_gap_reasoning,
        certification_gaps=output.certification_gaps,
        experience_gap_years=output.experience_gap_years,
        experience_gap_reasoning=output.experience_gap_reasoning,
        critical_bottlenecks=output.critical_bottlenecks,
        timeline_bottlenecks=output.timeline_bottlenecks,
        existing_strengths=output.existing_strengths,
        competitive_advantages=output.competitive_advantages,
        personality_frictions=output.personality_frictions,
        stress_risks=output.stress_risks,
        top_priorities=output.top_priorities,
        quick_wins=output.quick_wins,
    )

    for sg in output.technical_skill_gaps:
        lp = _normalize_learning_path(sg.learning_path)
        ga.technical_skill_gaps.append(SkillGap(
            skill_name=sg.skill_name, current_level=sg.current_level,
            required_level=sg.required_level, gap_severity=sg.gap_severity,
            estimated_time_to_close=sg.estimated_time_to_close,
            recommended_resources=sg.recommended_resources,
            reasoning=sg.reasoning, priority=sg.priority, learning_path=lp,
        ))

    for sg in output.soft_skill_gaps:
        lp = _normalize_learning_path(sg.learning_path)
        ga.soft_skill_gaps.append(SkillGap(
            skill_name=sg.skill_name, current_level=sg.current_level,
            required_level=sg.required_level, gap_severity=sg.gap_severity,
            estimated_time_to_close=sg.estimated_time_to_close,
            recommended_resources=sg.recommended_resources,
            reasoning=sg.reasoning, priority=sg.priority, learning_path=lp,
        ))

    # Ensure category matches score
    s = ga.overall_gap_score
    ga.gap_category = "minimal" if s < 20 else "manageable" if s < 50 else "significant" if s < 80 else "severe"
    return ga


def _normalize_learning_path(lp) -> list[str]:
    if isinstance(lp, list):
        return lp
    if isinstance(lp, str):
        import re
        parts = [p.strip() for p in re.split(r"\d+\.\s*|\n", lp) if p.strip()]
        return parts if parts else []
    return []


# ── Fallback ──────────────────────────────────────────────────────────────────

def _create_fallback_gap_analysis(profile, normalized, market, target_role: str) -> GapAnalysis:
    ga = GapAnalysis(overall_gap_score=55.0, gap_category="significant")

    defaults = [
        ("Python", "Intermediate", "Advanced", 50, "3 months", ["Codecademy Python", "LeetCode", "Real Python"]),
        ("Data Structures & Algorithms", "Basic", "Advanced", 65, "4 months", ["Coursera DS", "HackerRank", "NeetCode 150"]),
        ("System Design", "None", "Intermediate", 70, "6 months", ["System Design Primer", "Educative.io", "ByteByteGo"]),
        ("Cloud Services (AWS/GCP)", "None", "Intermediate", 60, "3 months", ["AWS CCP", "A Cloud Guru", "AWS Free Tier"]),
        ("Git & Version Control", "Basic", "Advanced", 40, "1 month", ["Git Docs", "GitHub Learning Lab"]),
        ("SQL & Databases", "Basic", "Intermediate", 45, "2 months", ["SQLZoo", "Mode SQL", "PostgreSQL Exercises"]),
    ]
    for name, cur, req, sev, t, res in defaults:
        ga.technical_skill_gaps.append(SkillGap(skill_name=name, current_level=cur, required_level=req, gap_severity=sev, estimated_time_to_close=t, recommended_resources=res))

    soft = [
        ("Technical Communication", "Intermediate", "Advanced", 45, "Ongoing", ["Toastmasters", "Tech Writing Course"]),
        ("Problem Solving", "Intermediate", "Expert", 55, "6 months", ["Critical Thinking Course", "Mock Interviews"]),
        ("Team Collaboration", "Basic", "Advanced", 50, "3 months", ["Agile/Scrum Cert", "Open Source"]),
    ]
    for name, cur, req, sev, t, res in soft:
        ga.soft_skill_gaps.append(SkillGap(skill_name=name, current_level=cur, required_level=req, gap_severity=sev, estimated_time_to_close=t, recommended_resources=res))

    ga.certification_gaps = ["AWS Cloud Practitioner", "Professional Scrum Master I"]
    ga.experience_gap_years = 1.5
    ga.critical_bottlenecks = ["Limited production experience", "No industry internship", "System design gap"]
    ga.timeline_bottlenecks = ["Advanced tech learning curve", "Network building takes 6-12 months", "Portfolio needs time"]
    ga.existing_strengths = ["Strong CS foundation", "Clear career goals", "Good foundational programming", "Academic projects"]
    ga.competitive_advantages = ["Fresh perspective", "Current academic knowledge", "Lower salary expectations"]
    return ga


# ── Helpers ───────────────────────────────────────────────────────────────────

def _format_market_requirements(market) -> str:
    if not market or not market.target_roles:
        return ("Standard Software Engineer Requirements:\n"
                "- Bachelor's in CS\n- Python/Java/JS proficiency\n- DS&A\n- Databases\n- Git\n- Problem-solving")
    lines: list[str] = []
    for role in market.target_roles:
        lines.append(f"\n### {role.role_title}")
        if role.hard_requirements:
            lines.append("**Hard Requirements:**")
            for r in role.hard_requirements:
                lines.append(f"- {r.skill_or_qualification}: {r.description or 'Required'}")
        if role.soft_requirements:
            lines.append("**Preferred:**")
            for r in role.soft_requirements:
                lines.append(f"- {r.skill_or_qualification}")
        if role.relevant_certifications:
            lines.append(f"**Certifications:** {', '.join(role.relevant_certifications)}")
        if role.emerging_skills:
            lines.append(f"**Emerging Skills:** {', '.join(role.emerging_skills)}")
    return "\n".join(lines) if lines else "Standard industry requirements"


def _perform_vibe_check(profile, market) -> dict:
    frictions: list[str] = []
    stress_risks: list[str] = []

    if profile.work_style:
        ws = profile.work_style.lower()
        targets = [r.lower() for r in (profile.specific_roles or [])]
        if "theor" in ws:
            practical = ["engineer", "developer", "technician"]
            if any(any(p in t for p in practical) for t in targets):
                frictions.append("Your theoretical work style may conflict with the hands-on nature of the target role.")

    if profile.risk_tolerance and profile.preferred_work_env:
        rl = profile.risk_tolerance.lower()
        envs = [e.lower() for e in profile.preferred_work_env]
        if "low" in rl and any("startup" in e for e in envs):
            stress_risks.append("STRESS RISK: Low risk tolerance conflicts with startup environments.")
            frictions.append("Low risk tolerance vs startup preference. Consider established companies with innovation teams.")
        if "high" in rl and any("corporate" in e for e in envs):
            frictions.append("High risk tolerance may lead to frustration in traditional corporate environments.")

    if profile.role_preference:
        rp = profile.role_preference.lower()
        targets = [r.lower() for r in (profile.specific_roles or [])]
        dynamic = ["consultant", "entrepreneur", "founder", "freelance", "creative"]
        if "structured" in rp and any(any(d in t for d in dynamic) for t in targets):
            frictions.append("Structured preference conflicts with dynamic target roles.")
            stress_risks.append("ADAPTABILITY STRESS: Structured preference + dynamic role may cause anxiety.")

    return {"frictions": frictions, "stress_risks": stress_risks}
