"""
Node F: RiskAssessor Agent
The Probability Engine – Assigns success probability and identifies risks.
Uses structured output for reliable data extraction.
"""

import time
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from ..models.state import CareerSimulationState, RiskAssessment, RiskFactor
from .base import get_llm


# ── Structured output models ─────────────────────────────────────────────────

class RiskFactorOutput(BaseModel):
    factor_name: str
    category: str = Field(description="market, personal, financial, technical")
    severity: str = Field(description="low, medium, high, critical")
    probability: float = Field(description="0-100")
    impact_description: str
    mitigation_strategy: str
    reasoning: str = Field(default="")


class RiskAssessmentOutput(BaseModel):
    success_probability_score: float = Field(description="0-100")
    success_reasoning: str
    confidence_interval: str = Field(description="e.g. '60-75%'")

    risk_factors: list[RiskFactorOutput] = Field(description="4-8 risk factors")

    market_risk_score: float
    market_risk_reasoning: str = Field(default="")
    personal_risk_score: float
    personal_risk_reasoning: str = Field(default="")
    financial_risk_score: float
    financial_risk_reasoning: str = Field(default="")
    technical_risk_score: float
    technical_risk_reasoning: str = Field(default="")

    positive_factors: list[str] = Field(description="4-6 positives")
    negative_factors: list[str] = Field(description="3-5 negatives")
    key_opportunities: list[str] = Field(default_factory=list)
    key_concerns: list[str] = Field(default_factory=list)

    compared_to_average: str = Field(description="Above average, Average, Below average")
    comparison_reasoning: str = Field(default="")
    peer_success_rate: float

    risk_mitigation_plan: list[str] = Field(description="5-7 actions")
    contingency_plans: list[str] = Field(description="3-5 backups")
    recommendations: list[str] = Field(default_factory=list)

    best_case_scenario: str = Field(default="")
    worst_case_scenario: str = Field(default="")
    most_likely_scenario: str = Field(default="")


# ── Prompt ────────────────────────────────────────────────────────────────────

RISK_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert career risk analyst. Provide:
1. Realistic success probability (0-100) WITH DETAILED REASONING
2. 4-8 risk factors across market/personal/financial/technical with reasoning
3. Category-specific risk scores with reasoning
4. Positive / negative factors, opportunities, concerns
5. Peer comparison
6. Mitigation plan, contingency plans
7. Best / worst / most likely scenarios

Be balanced, specific. NEVER leave arrays empty."""),

    ("human", """Risk assessment:

**PROFILE:** {profile_summary}
**Resume:** {resume_context}
**METRICS:** Academic {academic_score}/100 | Readiness {career_readiness}/100 | Skill {skill_readiness}/100 | Financial {financial_readiness}/100
**GAP:** Score {gap_score}/100 ({gap_category}) | Bottlenecks: {bottlenecks} | Skill gaps: {skill_gaps}
**MARKET:** Demand: {demand_level} | Competition: {competition_level} | Growth: {growth_outlook}
**PERSONAL:** Risk: {risk_tolerance} | Awareness: {market_awareness} | Mentor: {has_mentor} | Hours: {hours_week}/w | Concerns: {concerns}
**FINANCIAL:** Capacity: {investment_capacity} | Affordability: {affordability} | Investment: ${total_investment} | Break-even: Year {break_even_year}
**PATH:** Target: {target_role} | Timeline: {timeline_years}y | Salary: ${expected_salary}
**FRICTIONS:** {personality_frictions}

Provide a comprehensive risk assessment with detailed reasoning."""),
])


# ── Node ──────────────────────────────────────────────────────────────────────

def risk_assessor_node(state: CareerSimulationState) -> dict:
    """Node F: Assign success probability and identify risks."""
    start_time = time.time()

    profile = state["career_profile"]
    normalized = state.get("normalized_profile")
    market = state.get("market_insights")
    gap = state.get("gap_analysis")
    financial = state.get("financial_analysis")
    timeline = state.get("timeline_simulation")

    demand = competition = growth = "Medium"
    if market and market.target_roles:
        r = market.target_roles[0]
        demand, competition, growth = r.demand_level, r.competition_level, r.growth_outlook

    bottlenecks = "; ".join(gap.critical_bottlenecks[:3]) if gap and gap.critical_bottlenecks else "None"
    skill_gaps = ", ".join([f"{g.skill_name} ({g.gap_severity}/100)" for g in gap.technical_skill_gaps[:5]]) if gap and gap.technical_skill_gaps else "Not assessed"
    frictions = "; ".join(gap.personality_frictions[:3]) if gap and gap.personality_frictions else "None"

    career_path = None
    if timeline:
        if timeline.recommended_path == "conservative":
            career_path = timeline.conservative_path
        elif timeline.recommended_path == "ambitious":
            career_path = timeline.ambitious_path
        else:
            career_path = timeline.realistic_path

    target_role = career_path.final_target_role if career_path else "Software Engineer"
    timeline_years = career_path.total_years if career_path else 5
    expected_salary = career_path.final_expected_salary if career_path else 100000

    resume_context = profile.resume_text if hasattr(profile, "resume_text") and profile.resume_text else "No resume"

    llm = get_llm(temperature=0.3)

    try:
        structured = llm.with_structured_output(RiskAssessmentOutput)
        chain = RISK_PROMPT | structured
        output: RiskAssessmentOutput = chain.invoke({
            "profile_summary": normalized.profile_summary if normalized else "N/A",
            "resume_context": resume_context,
            "academic_score": round(normalized.academic_strength_score, 1) if normalized else 50,
            "career_readiness": round(normalized.career_readiness_score, 1) if normalized else 50,
            "skill_readiness": round(normalized.skill_readiness_score, 1) if normalized else 50,
            "financial_readiness": round(normalized.financial_readiness_score, 1) if normalized else 50,
            "gap_score": round(gap.overall_gap_score, 1) if gap else 50,
            "gap_category": gap.gap_category if gap else "significant",
            "bottlenecks": bottlenecks, "skill_gaps": skill_gaps,
            "demand_level": demand, "competition_level": competition, "growth_outlook": growth,
            "risk_tolerance": profile.risk_tolerance or "Medium",
            "market_awareness": profile.market_awareness or "Medium",
            "has_mentor": "Yes" if profile.has_mentor else "No",
            "hours_week": profile.hours_per_week or 20,
            "concerns": ", ".join(profile.career_concerns[:3]) if profile.career_concerns else "General uncertainty",
            "investment_capacity": profile.investment_capacity or "Medium",
            "affordability": financial.affordability_rating if financial else "feasible",
            "total_investment": financial.total_investment_required if financial else 15000,
            "break_even_year": financial.break_even_year if financial else 3,
            "target_role": target_role, "timeline_years": timeline_years, "expected_salary": expected_salary,
            "personality_frictions": frictions,
        })
        risk = _convert(output)
    except Exception as e:
        print(f"Structured output failed: {e}")
        risk = _fallback(profile, normalized, gap, financial)

    return {
        "risk_assessment": risk,
        "current_node": "risk_assessor",
        "processing_time_ms": {"risk_assessor": (time.time() - start_time) * 1000},
    }


# ── Converters ────────────────────────────────────────────────────────────────

def _convert(o: RiskAssessmentOutput) -> RiskAssessment:
    ra = RiskAssessment(
        success_probability_score=o.success_probability_score,
        success_reasoning=o.success_reasoning,
        confidence_interval=o.confidence_interval,
        market_risk_score=o.market_risk_score, market_risk_reasoning=o.market_risk_reasoning,
        personal_risk_score=o.personal_risk_score, personal_risk_reasoning=o.personal_risk_reasoning,
        financial_risk_score=o.financial_risk_score, financial_risk_reasoning=o.financial_risk_reasoning,
        technical_risk_score=o.technical_risk_score, technical_risk_reasoning=o.technical_risk_reasoning,
        positive_factors=o.positive_factors, negative_factors=o.negative_factors,
        key_opportunities=o.key_opportunities, key_concerns=o.key_concerns,
        compared_to_average=o.compared_to_average, comparison_reasoning=o.comparison_reasoning,
        peer_success_rate=o.peer_success_rate,
        risk_mitigation_plan=o.risk_mitigation_plan, contingency_plans=o.contingency_plans,
        recommendations=o.recommendations,
        best_case_scenario=o.best_case_scenario, worst_case_scenario=o.worst_case_scenario,
        most_likely_scenario=o.most_likely_scenario,
    )
    for rf in o.risk_factors:
        ra.risk_factors.append(RiskFactor(
            factor_name=rf.factor_name, category=rf.category, severity=rf.severity,
            probability=rf.probability, impact_description=rf.impact_description,
            mitigation_strategies=[rf.mitigation_strategy] if rf.mitigation_strategy else [],
            reasoning=getattr(rf, "reasoning", ""),
        ))
    return ra


# ── Fallback ──────────────────────────────────────────────────────────────────

def _fallback(profile, normalized, gap, financial) -> RiskAssessment:
    base = 60.0
    if normalized:
        base = (normalized.academic_strength_score + normalized.career_readiness_score + normalized.skill_readiness_score) / 3
    if gap:
        base = max(30, base - gap.overall_gap_score * 0.3 + 20)

    ra = RiskAssessment(
        success_probability_score=round(base, 1),
        confidence_interval=f"{max(20, base - 10):.0f}-{min(95, base + 15):.0f}%",
        market_risk_score=35.0, personal_risk_score=40.0, financial_risk_score=45.0, technical_risk_score=50.0,
        positive_factors=["Clear career goals", "Strong educational foundation", "High motivation", "Growing market demand", "Reasonable timeline"],
        negative_factors=["Skill gaps vs market", "Limited industry experience", "Competitive entry market", "Financial investment needed"],
        compared_to_average="Average", peer_success_rate=65.0,
        risk_mitigation_plan=["Start foundational skills immediately", "Build portfolio projects", "Network actively", "Seek internships", "Get certifications", "Find a mentor", "Track application responses"],
        contingency_plans=["Adjacent roles as stepping stones", "Freelance for portfolio", "Contract/consulting roles", "Related field pivot", "Part-time + skill dev"],
    )

    factors = [
        ("Market Saturation", "market", "medium", 45, "High entry-level competition", "Differentiate through specialisation"),
        ("Skill Obsolescence", "technical", "medium", 40, "Tech may become outdated", "Focus on fundamentals + emerging tech"),
        ("Financial Pressure", "financial", "medium", 50, "Investment strain during transition", "Budget plan + emergency fund"),
        ("Burnout Risk", "personal", "medium", 35, "Balancing work/life/learning", "Realistic pace + self-care"),
        ("Economic Downturn", "market", "low", 25, "Recession reduces hiring", "Emergency savings + recession-proof skills"),
        ("Imposter Syndrome", "personal", "high", 60, "Self-doubt in interviews", "Document achievements + peer support"),
    ]
    for name, cat, sev, prob, impact, mit in factors:
        ra.risk_factors.append(RiskFactor(factor_name=name, category=cat, severity=sev, probability=prob, impact_description=impact, mitigation_strategies=[mit]))

    return ra
