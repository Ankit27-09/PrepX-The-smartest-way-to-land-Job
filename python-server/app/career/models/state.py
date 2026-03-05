"""
Graph State Schema
Shared state that flows through the LangGraph career simulation workflow.
"""

from pydantic import BaseModel, Field
from typing import Optional, Annotated
import operator

from .career_profile import CareerProfile, NormalizedProfile, MarketInsights


# ── Skill / Gap Models ────────────────────────────────────────────────────────

class SkillGap(BaseModel):
    skill_name: str
    current_level: str
    required_level: str
    gap_severity: float = 0.0
    estimated_time_to_close: str = ""
    recommended_resources: list[str] = Field(default_factory=list)
    reasoning: str = ""
    priority: str = "medium"
    learning_path: list[str] = Field(default_factory=list)


class GapAnalysis(BaseModel):
    overall_gap_score: float = 0.0
    gap_category: str = "manageable"
    analysis_reasoning: str = ""
    technical_skill_gaps: list[SkillGap] = Field(default_factory=list)
    soft_skill_gaps: list[SkillGap] = Field(default_factory=list)
    education_gap: Optional[str] = None
    education_gap_reasoning: str = ""
    certification_gaps: list[str] = Field(default_factory=list)
    experience_gap_years: float = 0.0
    experience_gap_reasoning: str = ""
    critical_bottlenecks: list[str] = Field(default_factory=list)
    timeline_bottlenecks: list[str] = Field(default_factory=list)
    existing_strengths: list[str] = Field(default_factory=list)
    competitive_advantages: list[str] = Field(default_factory=list)
    personality_frictions: list[str] = Field(default_factory=list)
    stress_risks: list[str] = Field(default_factory=list)
    top_priorities: list[str] = Field(default_factory=list)
    quick_wins: list[str] = Field(default_factory=list)


# ── Timeline Models ──────────────────────────────────────────────────────────

class YearMilestone(BaseModel):
    quarter: int
    title: str
    description: str
    type: str = "skill"
    estimated_cost: float = 0.0
    estimated_hours: int = 0
    resources: list[str] = Field(default_factory=list)
    success_metrics: list[str] = Field(default_factory=list)
    reasoning: str = ""
    dependencies: list[str] = Field(default_factory=list)
    risk_if_skipped: str = ""


class YearPlan(BaseModel):
    year_number: int
    year_label: str
    phase: str
    phase_reasoning: str = ""
    primary_focus: str
    focus_reasoning: str = ""
    milestones: list[YearMilestone] = Field(default_factory=list)
    expected_role: Optional[str] = None
    expected_salary_range: Optional[str] = None
    key_skills_acquired: list[str] = Field(default_factory=list)
    skill_progress_target: dict = Field(default_factory=dict)
    potential_setbacks: list[str] = Field(default_factory=list)
    buffer_time_weeks: int = 0
    risk_mitigation: list[str] = Field(default_factory=list)
    year_summary: str = ""
    success_indicators: list[str] = Field(default_factory=list)


class CareerPath(BaseModel):
    path_type: str
    path_label: str
    total_years: int = 5
    yearly_plans: list[YearPlan] = Field(default_factory=list)
    final_target_role: str = ""
    final_expected_salary: float = 0.0
    major_milestones: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    key_decision_points: list[str] = Field(default_factory=list)


class TimelineSimulation(BaseModel):
    conservative_path: Optional[CareerPath] = None
    realistic_path: Optional[CareerPath] = None
    ambitious_path: Optional[CareerPath] = None
    recommended_path: str = "realistic"
    recommendation_reason: str = ""
    vibe_check_warnings: list[str] = Field(default_factory=list)
    alignment_score: float = 0.0


# ── Financial Models ─────────────────────────────────────────────────────────

class CostBreakdown(BaseModel):
    item_name: str
    category: str
    amount: float
    currency: str = "USD"
    is_recurring: bool = False
    frequency: Optional[str] = None
    notes: Optional[str] = None


class YearlyFinancials(BaseModel):
    year_number: int
    total_investment: float = 0.0
    cost_breakdown: list[CostBreakdown] = Field(default_factory=list)
    expected_income: float = 0.0
    income_source: str = ""
    net_cash_flow: float = 0.0
    cumulative_investment: float = 0.0
    cumulative_income: float = 0.0


class FinancialAnalysis(BaseModel):
    total_investment_required: float = 0.0
    investment_reasoning: str = ""
    yearly_financials: list[YearlyFinancials] = Field(default_factory=list)
    break_even_year: int = 0
    break_even_month: int = 0
    break_even_reasoning: str = ""
    five_year_roi: float = 0.0
    five_year_roi_reasoning: str = ""
    ten_year_projected_earnings: float = 0.0
    salary_milestones: list[dict] = Field(default_factory=list)
    affordability_rating: str = "feasible"
    affordability_reasoning: str = ""
    affordability_notes: list[str] = Field(default_factory=list)
    cost_saving_opportunities: list[str] = Field(default_factory=list)
    funding_options: list[str] = Field(default_factory=list)
    meets_min_salary_target: bool = False
    years_to_target_salary: int = 0
    salary_target_reasoning: str = ""
    investment_by_category: dict = Field(default_factory=dict)


# ── Risk Models ──────────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    factor_name: str
    category: str
    severity: str
    probability: float = 0.0
    impact_description: str = ""
    reasoning: str = ""
    mitigation_strategies: list[str] = Field(default_factory=list)
    early_warning_signs: list[str] = Field(default_factory=list)


class RiskAssessment(BaseModel):
    success_probability_score: float = 0.0
    success_reasoning: str = ""
    confidence_interval: str = ""
    risk_factors: list[RiskFactor] = Field(default_factory=list)
    market_risk_score: float = 0.0
    market_risk_reasoning: str = ""
    personal_risk_score: float = 0.0
    personal_risk_reasoning: str = ""
    financial_risk_score: float = 0.0
    financial_risk_reasoning: str = ""
    technical_risk_score: float = 0.0
    technical_risk_reasoning: str = ""
    positive_factors: list[str] = Field(default_factory=list)
    negative_factors: list[str] = Field(default_factory=list)
    key_opportunities: list[str] = Field(default_factory=list)
    key_concerns: list[str] = Field(default_factory=list)
    compared_to_average: str = ""
    comparison_reasoning: str = ""
    peer_success_rate: float = 0.0
    risk_mitigation_plan: list[str] = Field(default_factory=list)
    contingency_plans: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    best_case_scenario: str = ""
    worst_case_scenario: str = ""
    most_likely_scenario: str = ""


# ── Dashboard Helper Models ───────────────────────────────────────────────────

class DashboardMilestone(BaseModel):
    id: str = ""
    title: str = ""
    description: str = ""
    year: int = 0
    quarter: int = 0
    type: str = "milestone"
    status: str = "pending"
    position: dict = Field(default_factory=dict)


class SkillNode(BaseModel):
    id: str = ""
    name: str = ""
    current_level: int = 0
    target_level: int = 3
    category: str = "technical"
    resources: list[str] = Field(default_factory=list)
    estimated_time: str = ""


# ── Dashboard Models ─────────────────────────────────────────────────────────

class DashboardData(BaseModel):
    milestones: list[dict] = Field(default_factory=list)
    milestone_connections: list[dict] = Field(default_factory=list)
    skill_nodes: list[dict] = Field(default_factory=list)
    salary_progression: list[dict] = Field(default_factory=list)
    cost_vs_income: list[dict] = Field(default_factory=list)
    skill_radar: list[dict] = Field(default_factory=list)
    risk_breakdown: list[dict] = Field(default_factory=list)
    gap_analysis_chart: list[dict] = Field(default_factory=list)
    timeline_progress: list[dict] = Field(default_factory=list)
    investment_breakdown: list[dict] = Field(default_factory=list)
    monthly_projection: list[dict] = Field(default_factory=list)
    success_probability_gauge: float = 0.0
    summary_stats: dict = Field(default_factory=dict)
    key_metrics: list[dict] = Field(default_factory=list)
    timeline_events: list[dict] = Field(default_factory=list)
    key_insights: list[dict] = Field(default_factory=list)
    decision_rationale: list[dict] = Field(default_factory=list)
    top_recommendations: list[str] = Field(default_factory=list)
    immediate_actions: list[dict] = Field(default_factory=list)
    risk_indicators: list[dict] = Field(default_factory=list)
    path_comparison: list[dict] = Field(default_factory=list)
    selected_career_summary: dict = Field(default_factory=dict)


# ── Career Matcher Models (Stage 1) ─────────────────────────────────────────

class CareerFitReasoning(BaseModel):
    strengths_alignment: list[str] = Field(default_factory=list)
    interest_match: list[str] = Field(default_factory=list)
    skill_transferability: list[str] = Field(default_factory=list)
    growth_potential_reasons: list[str] = Field(default_factory=list)
    market_demand_reasons: list[str] = Field(default_factory=list)
    potential_challenges: list[str] = Field(default_factory=list)
    why_now: str = ""


class CareerFit(BaseModel):
    rank: int = 1
    career_title: str = ""
    career_field: str = ""
    overall_fit_score: float = 0.0
    skill_fit_score: float = 0.0
    interest_fit_score: float = 0.0
    market_fit_score: float = 0.0
    personality_fit_score: float = 0.0
    tagline: str = ""
    reasoning: CareerFitReasoning = Field(default_factory=CareerFitReasoning)
    typical_salary_range: str = ""
    time_to_entry: str = ""
    difficulty_level: str = "Moderate"
    top_3_reasons: list[str] = Field(default_factory=list)
    key_skills_needed: list[str] = Field(default_factory=list)
    immediate_next_steps: list[str] = Field(default_factory=list)


class CareerMatcherResult(BaseModel):
    analysis_summary: str = ""
    profile_highlights: list[str] = Field(default_factory=list)
    career_fits: list[CareerFit] = Field(default_factory=list)
    methodology_explanation: str = ""
    confidence_level: str = "Medium"
    confidence_reasoning: str = ""


class AlternativeCareer(BaseModel):
    role_title: str
    field: str
    similarity_to_original: float = 0.0
    reasons_suggested: list[str] = Field(default_factory=list)
    gap_score: float = 0.0
    transition_difficulty: str = "Moderate"


# ── Reducer helpers ──────────────────────────────────────────────────────────

def merge_dicts(left: dict | None, right: dict | None) -> dict:
    if left is None:
        return right or {}
    if right is None:
        return left
    return {**left, **right}


def last_value(left: str | None, right: str | None) -> str:
    return right if right else (left or "")


# ── Main Graph State ─────────────────────────────────────────────────────────

from typing import TypedDict


class CareerSimulationState(TypedDict, total=False):
    career_profile: CareerProfile
    career_matcher_result: CareerMatcherResult | None
    selected_career_index: int
    selected_career: CareerFit | None
    stage: str
    normalized_profile: NormalizedProfile | None
    market_insights: MarketInsights | None
    gap_analysis: GapAnalysis | None
    alternative_careers: list[AlternativeCareer]
    should_suggest_alternatives: bool
    timeline_simulation: TimelineSimulation | None
    financial_analysis: FinancialAnalysis | None
    risk_assessment: RiskAssessment | None
    dashboard_data: DashboardData | None
    current_node: Annotated[str, last_value]
    errors: Annotated[list[str], operator.add]
    warnings: Annotated[list[str], operator.add]
    processing_time_ms: Annotated[dict[str, float], merge_dicts]
    simulation_complete: bool
    final_report_summary: str


def create_initial_state(profile: CareerProfile) -> CareerSimulationState:
    return CareerSimulationState(
        career_profile=profile,
        career_matcher_result=None,
        selected_career_index=-1,
        selected_career=None,
        stage="matching",
        normalized_profile=None,
        market_insights=None,
        gap_analysis=None,
        alternative_careers=[],
        should_suggest_alternatives=False,
        timeline_simulation=None,
        financial_analysis=None,
        risk_assessment=None,
        dashboard_data=None,
        current_node="start",
        errors=[],
        warnings=[],
        processing_time_ms={},
        simulation_complete=False,
        final_report_summary="",
    )
