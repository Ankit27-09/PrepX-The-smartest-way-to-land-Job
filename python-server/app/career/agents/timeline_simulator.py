"""
Node D: TimelineSimulator Agent
The Core Engine – Generates year-by-year career simulation paths.
Uses structured output, generating each path separately to avoid JSON parsing errors.
"""

import time
from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from ..models.state import (
    CareerSimulationState, TimelineSimulation, CareerPath, YearPlan, YearMilestone,
)
from .base import get_llm


# ── Structured output models ─────────────────────────────────────────────────

class MilestoneOutput(BaseModel):
    quarter: int = Field(description="Quarter 1-4")
    title: str = Field(description="Short title")
    description: str = Field(description="What to accomplish")
    type: str = Field(description="education, skill, career, certification, project, or networking")
    estimated_cost: float = Field(description="Cost in USD")
    estimated_hours: int = Field(description="Hours to complete")
    reasoning: str = Field(default="", description="Why this milestone matters")
    dependencies: list[str] = Field(default_factory=list)
    risk_if_skipped: str = Field(default="")


class YearPlanOutput(BaseModel):
    year_number: int
    year_label: str = Field(description="e.g. 'Year 1: Foundation Building'")
    phase: str = Field(description="Preparation, Transition, or Growth")
    primary_focus: str
    phase_reasoning: str = Field(default="")
    focus_reasoning: str = Field(default="")
    milestones: list[MilestoneOutput] = Field(description="4 milestones, one per quarter")
    expected_role: Optional[str] = None
    expected_salary_range: Optional[str] = None
    key_skills_acquired: list[str] = Field(default_factory=list)
    skill_progress_target: int = Field(default=25)
    potential_setbacks: list[str] = Field(default_factory=list)
    risk_mitigation: list[str] = Field(default_factory=list)
    success_indicators: list[str] = Field(default_factory=list)
    buffer_time_weeks: int = Field(default=4)


class CareerPathOutput(BaseModel):
    path_label: str
    total_years: int
    yearly_plans: list[YearPlanOutput]
    final_target_role: str
    final_expected_salary: float
    major_milestones: list[str]
    assumptions: list[str]
    key_decision_points: list[str]


class SinglePathOutput(BaseModel):
    path: CareerPathOutput


class RecommendationOutput(BaseModel):
    recommended_path: str = Field(description="conservative, realistic, or ambitious")
    recommendation_reason: str
    alignment_score: float = Field(description="0-100")
    vibe_check_warnings: list[str] = Field(default_factory=list)


# ── Prompts ───────────────────────────────────────────────────────────────────

SINGLE_PATH_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert career simulation engine generating a **{path_type}** path:
{path_description}

For EACH year provide 4 milestones (one per quarter) with specific activities, costs, hours, reasoning, dependencies.
Name actual courses (Coursera, Udemy), certifications (AWS, Google), networking activities.
Provide realistic cost estimates. NEVER leave arrays empty."""),
    ("human", """Generate a {total_years}-year {path_type} career path:

**CANDIDATE:** {profile_summary}
**Education:** {education_level} | Graduation: {years_to_grad} | Skills: {current_skills}
**TARGET:** {target_roles} | Goal: {career_goal} | Level: {desired_level}
**GAP:** Score {gap_score}/100 | Critical: {critical_gaps} | Skills: {skill_gaps} | Education: {education_gap}
**CONSTRAINTS:** {hours_week}h/week | Learning: {learning_mode} | Budget: {investment} | Risk: {risk_tolerance}
**MARKET:** Demand: {demand_level} | Competition: {competition_level} | Entry: {entry_salary} | Senior: {senior_salary}

Generate the complete {path_type} career path with detailed quarterly milestones."""),
])

RECOMMENDATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are a career advisor. Recommend the best path considering risk tolerance, time, and personality."),
    ("human", """**CANDIDATE:** Risk: {risk_tolerance} | Optimism: {optimism} | Hours: {hours_week}/week | Style: {work_style}
**PATHS:**
1. Conservative ({conservative_years}y): {conservative_label}
2. Realistic ({realistic_years}y): {realistic_label}
3. Ambitious ({ambitious_years}y): {ambitious_label}
**FRICTIONS:** {frictions}

Which path do you recommend and why?"""),
])


# ── Node ──────────────────────────────────────────────────────────────────────

def timeline_simulator_node(state: CareerSimulationState) -> dict:
    """Node D: Generate year-by-year career simulation with three paths."""
    start_time = time.time()

    profile = state["career_profile"]
    normalized = state.get("normalized_profile")
    market = state.get("market_insights")
    gap = state.get("gap_analysis")

    # Determine length
    base_years = 6 if (gap and gap.overall_gap_score > 70) else 5 if (gap and gap.overall_gap_score > 40) else 4

    # Salary data
    entry_salary = "$50,000 - $80,000"
    senior_salary = "$120,000 - $180,000"
    demand_level = competition_level = "Medium"
    if market and market.target_roles:
        r = market.target_roles[0]
        if r.salary_range:
            entry_salary = f"${r.salary_range.entry_level_min:,.0f} - ${r.salary_range.entry_level_max:,.0f}"
            senior_salary = f"${r.salary_range.senior_level_min:,.0f} - ${r.salary_range.senior_level_max:,.0f}"
        demand_level, competition_level = r.demand_level, r.competition_level

    skill_gaps = ", ".join([g.skill_name for g in gap.technical_skill_gaps[:5]]) if gap and gap.technical_skill_gaps else "Not assessed"
    critical_gaps = "; ".join(gap.critical_bottlenecks[:3]) if gap and gap.critical_bottlenecks else "None"
    frictions = "; ".join((gap.personality_frictions + gap.stress_risks)[:3]) if gap and (gap.personality_frictions or gap.stress_risks) else "None"

    common = {
        "profile_summary": normalized.profile_summary if normalized else "N/A",
        "education_level": profile.current_education_level or "Not specified",
        "years_to_grad": normalized.years_to_graduation if normalized else "Unknown",
        "current_skills": str(normalized.combined_technical_skills) if normalized else "Not assessed",
        "target_roles": ", ".join(profile.specific_roles) if profile.specific_roles else "Software Engineer",
        "career_goal": profile.primary_career_goal or "Career advancement",
        "desired_level": profile.desired_role_level or "Senior IC",
        "gap_score": round(gap.overall_gap_score, 1) if gap else 50,
        "critical_gaps": critical_gaps,
        "skill_gaps": skill_gaps,
        "education_gap": gap.education_gap if gap and gap.education_gap else "None",
        "hours_week": profile.hours_per_week or 20,
        "learning_mode": ", ".join(profile.preferred_learning_mode) if profile.preferred_learning_mode else "Self-paced",
        "investment": profile.investment_capacity or "Medium ($5,000-15,000)",
        "risk_tolerance": profile.risk_tolerance or "Medium",
        "demand_level": demand_level,
        "competition_level": competition_level,
        "entry_salary": entry_salary,
        "senior_salary": senior_salary,
    }

    path_configs = {
        "conservative": {"total_years": base_years + 1, "description": "Safe, methodical approach with extra buffer. Lower risk, thorough prep."},
        "realistic": {"total_years": base_years, "description": "Balanced approach. Standard timeline, moderate pace."},
        "ambitious": {"total_years": max(base_years - 1, 3), "description": "Aggressive timeline. Compressed, high intensity."},
    }

    llm = get_llm(temperature=0.5)
    target_role = profile.specific_roles[0] if profile.specific_roles else "Software Engineer"

    try:
        paths: dict[str, CareerPath] = {}
        for pt, cfg in path_configs.items():
            po = _generate_single_path(llm, pt, cfg, common)
            paths[pt] = _convert_career_path(po, pt) if po else _create_fallback_path(pt, cfg["total_years"], target_role, gap)

        rec = _generate_recommendation(llm, paths, profile, frictions)

        timeline_simulation = TimelineSimulation(
            recommended_path=rec["recommended_path"],
            recommendation_reason=rec["recommendation_reason"],
            alignment_score=rec["alignment_score"],
            vibe_check_warnings=rec["vibe_check_warnings"],
            conservative_path=paths["conservative"],
            realistic_path=paths["realistic"],
            ambitious_path=paths["ambitious"],
        )
    except Exception as e:
        print(f"Path generation failed: {e}")
        timeline_simulation = _create_fallback_simulation(base_years, target_role, gap)

    return {
        "timeline_simulation": timeline_simulation,
        "current_node": "timeline_simulator",
        "processing_time_ms": {"timeline_simulator": (time.time() - start_time) * 1000},
    }


# ── Generation helpers ────────────────────────────────────────────────────────

def _generate_single_path(llm, path_type: str, config: dict, common: dict) -> Optional[CareerPathOutput]:
    try:
        structured = llm.with_structured_output(SinglePathOutput)
        chain = SINGLE_PATH_PROMPT | structured
        result: SinglePathOutput = chain.invoke({**common, "path_type": path_type.upper(), "path_description": config["description"], "total_years": config["total_years"]})
        return result.path
    except Exception as e:
        print(f"Failed {path_type} path: {e}")
        return None


def _generate_recommendation(llm, paths: dict, profile, frictions: str) -> dict:
    try:
        structured = llm.with_structured_output(RecommendationOutput)
        chain = RECOMMENDATION_PROMPT | structured
        r: RecommendationOutput = chain.invoke({
            "risk_tolerance": profile.risk_tolerance or "Medium",
            "optimism": profile.optimism_level or "Balanced",
            "hours_week": profile.hours_per_week or 20,
            "work_style": profile.work_style or "Balanced",
            "conservative_years": paths["conservative"].total_years,
            "conservative_label": paths["conservative"].path_label,
            "realistic_years": paths["realistic"].total_years,
            "realistic_label": paths["realistic"].path_label,
            "ambitious_years": paths["ambitious"].total_years,
            "ambitious_label": paths["ambitious"].path_label,
            "frictions": frictions,
        })
        return {"recommended_path": r.recommended_path, "recommendation_reason": r.recommendation_reason, "alignment_score": r.alignment_score, "vibe_check_warnings": r.vibe_check_warnings}
    except Exception:
        return {"recommended_path": "realistic", "recommendation_reason": "The realistic path balances speed and risk.", "alignment_score": 75.0, "vibe_check_warnings": []}


# ── Converters ────────────────────────────────────────────────────────────────

def _convert_career_path(po: CareerPathOutput, path_type: str) -> CareerPath:
    path = CareerPath(
        path_type=path_type, path_label=po.path_label, total_years=po.total_years,
        final_target_role=po.final_target_role, final_expected_salary=po.final_expected_salary,
        major_milestones=po.major_milestones, assumptions=po.assumptions, key_decision_points=po.key_decision_points,
    )
    for yo in po.yearly_plans:
        yp = YearPlan(
            year_number=yo.year_number, year_label=yo.year_label, phase=yo.phase,
            primary_focus=yo.primary_focus, phase_reasoning=getattr(yo, "phase_reasoning", ""),
            focus_reasoning=getattr(yo, "focus_reasoning", ""),
            expected_role=yo.expected_role, expected_salary_range=yo.expected_salary_range,
            key_skills_acquired=yo.key_skills_acquired,
            skill_progress_target={"overall": getattr(yo, "skill_progress_target", 25)},
            potential_setbacks=yo.potential_setbacks,
            risk_mitigation=getattr(yo, "risk_mitigation", []),
            success_indicators=getattr(yo, "success_indicators", []),
            buffer_time_weeks=yo.buffer_time_weeks,
        )
        for m in yo.milestones:
            yp.milestones.append(YearMilestone(
                quarter=m.quarter, title=m.title, description=m.description, type=m.type,
                estimated_cost=m.estimated_cost, estimated_hours=m.estimated_hours,
                reasoning=getattr(m, "reasoning", ""), dependencies=getattr(m, "dependencies", []),
                risk_if_skipped=getattr(m, "risk_if_skipped", ""),
            ))
        path.yearly_plans.append(yp)
    return path


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _create_fallback_simulation(total_years: int, target_role: str, gap) -> TimelineSimulation:
    sim = TimelineSimulation(
        recommended_path="realistic",
        recommendation_reason="Balanced path based on your profile.",
        alignment_score=75.0,
        vibe_check_warnings=["Allocate time for practical projects", "Join tech communities early"],
    )
    for pt in ["conservative", "realistic", "ambitious"]:
        p = _create_fallback_path(pt, total_years, target_role, gap)
        setattr(sim, f"{pt}_path", p)
    return sim


def _create_fallback_path(path_type: str, total_years: int, target_role: str, gap) -> CareerPath:
    yrs = total_years + 1 if path_type == "conservative" else max(total_years - 1, 3) if path_type == "ambitious" else total_years
    sm = 0.9 if path_type == "conservative" else 1.1 if path_type == "ambitious" else 1.0

    path = CareerPath(
        path_type=path_type, path_label=f"The {path_type.title()} {target_role} Path",
        total_years=yrs, final_target_role=f"Senior {target_role}", final_expected_salary=130000 * sm,
        major_milestones=["Complete foundations", "First internship", "Industry certs", "Transition to target role", "Senior expertise"],
        assumptions=[f"Dedicated {20 if path_type == 'conservative' else 30 if path_type == 'ambitious' else 25}h/week", "Consistent progress", "Access to resources"],
        key_decision_points=["Year 1: Choose specialization", "Year 2: Certification path", f"Year {yrs - 1}: Evaluate trajectory"],
    )

    phases = {1: "Preparation", 2: "Transition", 3: "Transition", 4: "Growth", 5: "Growth", 6: "Mastery"}
    for yn in range(1, yrs + 1):
        phase = phases.get(yn, "Growth")
        yp = YearPlan(
            year_number=yn, year_label=f"Year {yn}: {phase} Phase", phase=phase,
            primary_focus=_get_year_focus(yn, target_role),
            expected_role=_get_expected_role(yn, target_role),
            expected_salary_range=_get_expected_salary(yn, sm),
            key_skills_acquired=_get_year_skills(yn),
            potential_setbacks=["Steeper learning curve", "Market fluctuations", "Competing priorities"],
            buffer_time_weeks=6 if path_type == "conservative" else 2 if path_type == "ambitious" else 4,
        )
        for q in range(1, 5):
            yp.milestones.append(_create_milestone(yn, q, target_role, path_type))
        path.yearly_plans.append(yp)
    return path


_FOCUS = {1: "Build foundational skills", 2: "Practical experience", 3: "Certifications & networking", 4: "Full-time position", 5: "Senior responsibilities", 6: "Expertise & mentoring"}
_ROLES = {1: "Student / Learner", 2: "Intern / Junior Developer", 3: "Junior {}", 4: "{}", 5: "Senior {}", 6: "Lead {}"}
_SALARIES = {1: None, 2: "$30k-$50k (intern)", 3: "$55k-$75k", 4: "$75k-$95k", 5: "$95k-$130k", 6: "$130k-$160k"}
_SKILLS = {1: ["Python/JS basics", "Git", "DS&A", "HTML/CSS"], 2: ["Frameworks", "Databases", "REST APIs", "Testing"],
           3: ["Cloud (AWS/GCP)", "CI/CD", "System design", "Agile"], 4: ["Advanced design", "Perf optimization", "Security", "Leadership"],
           5: ["Architecture", "Mentoring", "Technical planning"], 6: ["Strategic leadership", "Industry expertise"]}

def _get_year_focus(y, role):
    return _FOCUS.get(y, f"Continue growth as {role}")
def _get_expected_role(y, role):
    return _ROLES.get(y, role).format(role)
def _get_expected_salary(y, m):
    return _SALARIES.get(y)
def _get_year_skills(y):
    return _SKILLS.get(y, ["Continued development"])

_MILESTONES = {
    1: {1: ("Complete Python Fundamentals", "Codecademy Python + 3 projects", "education", 50, 60),
        2: ("Master Data Structures", "Coursera DS + 50 LeetCode", "skill", 100, 80),
        3: ("Build Portfolio Project", "Full-stack web app", "project", 0, 100),
        4: ("Learn Cloud Basics", "AWS CCP preparation", "certification", 200, 60)},
    2: {1: ("Start Internship Search", "30+ applications, LinkedIn, interviews", "career", 50, 40),
        2: ("Earn AWS Certification", "Pass AWS CCP exam", "certification", 150, 40),
        3: ("Complete Summer Internship", "Hands-on industry experience", "career", 0, 480),
        4: ("Build Advanced Project", "Complex project with new skills", "project", 100, 80)},
    3: {1: ("Deepen Technical Skills", "Master advanced specialization", "skill", 200, 100),
        2: ("Expand Network", "3+ meetups, 20+ connections", "networking", 100, 30),
        3: ("Job Search Prep", "Resume, system design, mocks", "career", 50, 60),
        4: ("Land Entry-Level Position", "First full-time role", "career", 0, 80)},
    4: {1: ("Onboard Successfully", "Ship first feature", "career", 0, 480),
        2: ("Lead Small Project", "Own a feature", "career", 0, 480),
        3: ("Advanced Certification", "Professional-level cert", "certification", 300, 60),
        4: ("Prepare for Promotion", "Document achievements", "career", 0, 40)},
    5: {1: ("Senior Promotion", "Demonstrate senior impact", "career", 0, 480),
        2: ("Mentor Junior Devs", "Guide 2-3 juniors", "skill", 0, 40),
        3: ("Lead Major Initiative", "Own significant project", "career", 0, 480),
        4: ("Industry Recognition", "Speak or publish", "networking", 200, 60)},
}

def _create_milestone(year, quarter, role, path_type) -> YearMilestone:
    tpl = _MILESTONES.get(year, _MILESTONES[5])
    title, desc, typ, cost, hrs = tpl.get(quarter, ("Continue Growth", "Professional development", "skill", 0, 40))
    if path_type == "conservative":
        hrs = int(hrs * 0.8)
    elif path_type == "ambitious":
        hrs = int(hrs * 1.2)
    return YearMilestone(quarter=quarter, title=title, description=desc, type=typ, estimated_cost=cost, estimated_hours=hrs)
