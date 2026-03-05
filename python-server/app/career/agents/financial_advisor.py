"""
Node E: FinancialAdvisor Agent
The ROI Calculator – Calculates cost of roadmap vs potential earnings.
Uses structured output for reliable data extraction.
"""

import time
from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from ..models.state import (
    CareerSimulationState, FinancialAnalysis, YearlyFinancials, CostBreakdown,
)
from .base import get_llm


# ── Structured output models ─────────────────────────────────────────────────

class CostItemOutput(BaseModel):
    item_name: str
    amount: float
    category: str = Field(description="education, certification, tools, living, opportunity")
    is_recurring: bool
    frequency: str = Field(description="one-time, monthly, yearly")


class YearlyFinancialsOutput(BaseModel):
    year_number: int
    total_investment: float
    costs: list[CostItemOutput] = Field(description="3-6 cost items")
    expected_income: float
    income_source: str = Field(description="None, Internship, Part-time, Full-time, Freelance")
    net_cash_flow: float
    cumulative_investment: float
    cumulative_income: float


class FinancialAnalysisOutput(BaseModel):
    total_investment_required: float
    investment_reasoning: str
    yearly_financials: list[YearlyFinancialsOutput]
    break_even_year: int
    break_even_month: int = Field(description="Month 1-12 within break-even year")
    break_even_reasoning: str
    five_year_roi: float
    five_year_roi_reasoning: str
    ten_year_projected_earnings: float
    affordability_rating: str = Field(description="comfortable, feasible, stretch, unfeasible")
    affordability_reasoning: str
    affordability_notes: list[str] = Field(description="3-5 notes")
    cost_saving_opportunities: list[str] = Field(description="3-5 ways to reduce costs")
    funding_options: list[str] = Field(description="3-5 funding options")
    meets_min_salary_target: bool
    years_to_target_salary: int
    salary_target_reasoning: str
    salary_milestones: list[dict] = Field(default_factory=list, description="[{year, expected_salary, role, reasoning}]")
    investment_by_category: dict = Field(default_factory=dict, description="{category: amount}")


# ── Prompt ────────────────────────────────────────────────────────────────────

FINANCIAL_ANALYSIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert financial advisor specialising in education ROI and career investment analysis.

Provide DETAILED financial analysis WITH REASONING:
1. Total Investment Required with explanation
2. Yearly Financials – 4-6 cost items per year, income, net cash flow
3. Break-Even Analysis with reasoning
4. ROI Metrics – 5-year ROI, 10-year projected
5. Affordability Assessment
6. Cost-Saving Opportunities (3-5)
7. Funding Options (3-5)
8. Salary Milestones
9. Investment by Category

Be SPECIFIC with cost estimates. NEVER leave arrays empty."""),

    ("human", """Perform comprehensive financial analysis:

**USER:** Investment: {investment_capacity} | Dependents: {has_dependents} | Target Salary: ${target_salary} | Country: {country}
**PATH:** {career_path_summary}
**MARKET SALARY:** Entry: {entry_salary} | Mid: {mid_salary} | Senior: {senior_salary}
**GAPS:** Skills: {skill_gaps} | Certs: {cert_gaps}
**TIMELINE:** {total_years} years | Target: {target_role}

Provide detailed projections with reasoning."""),
])


# ── Node ──────────────────────────────────────────────────────────────────────

def financial_advisor_node(state: CareerSimulationState) -> dict:
    """Node E: Calculate career roadmap costs vs potential earnings."""
    start_time = time.time()

    profile = state["career_profile"]
    market = state.get("market_insights")
    timeline = state.get("timeline_simulation")
    gap = state.get("gap_analysis")

    # Get the recommended path
    career_path = None
    if timeline:
        if timeline.recommended_path == "conservative" and timeline.conservative_path:
            career_path = timeline.conservative_path
        elif timeline.recommended_path == "ambitious" and timeline.ambitious_path:
            career_path = timeline.ambitious_path
        elif timeline.realistic_path:
            career_path = timeline.realistic_path

    career_path_summary = _format_career_path(career_path)

    entry_salary = mid_salary = senior_salary = "50000 - 80000"
    if market and market.target_roles:
        r = market.target_roles[0]
        if r.salary_range:
            entry_salary = f"{r.salary_range.entry_level_min:.0f} - {r.salary_range.entry_level_max:.0f}"
            mid_salary = f"{r.salary_range.mid_level_min:.0f} - {r.salary_range.mid_level_max:.0f}"
            senior_salary = f"{r.salary_range.senior_level_min:.0f} - {r.salary_range.senior_level_max:.0f}"

    skill_gaps = ", ".join([g.skill_name for g in gap.technical_skill_gaps[:5]]) if gap and gap.technical_skill_gaps else "General skill development"
    cert_gaps = ", ".join(gap.certification_gaps) if gap and gap.certification_gaps else "Industry certifications"

    total_years = career_path.total_years if career_path else 5
    target_role = career_path.final_target_role if career_path else "Software Engineer"

    llm = get_llm(temperature=0.3)

    try:
        structured = llm.with_structured_output(FinancialAnalysisOutput)
        chain = FINANCIAL_ANALYSIS_PROMPT | structured
        output: FinancialAnalysisOutput = chain.invoke({
            "investment_capacity": profile.investment_capacity or "Medium ($5,000 - $15,000)",
            "has_dependents": "Yes" if profile.financial_dependents else "No",
            "target_salary": profile.target_min_salary or 80000,
            "country": profile.current_country or "United States",
            "career_path_summary": career_path_summary,
            "entry_salary": entry_salary, "mid_salary": mid_salary, "senior_salary": senior_salary,
            "skill_gaps": skill_gaps, "cert_gaps": cert_gaps,
            "total_years": total_years, "target_role": target_role,
        })
        financial = _convert_to_financial_analysis(output)
    except Exception as e:
        print(f"Structured output failed, fallback: {e}")
        financial = _create_fallback_financial_analysis(career_path, profile, gap)

    return {
        "financial_analysis": financial,
        "current_node": "financial_advisor",
        "processing_time_ms": {"financial_advisor": (time.time() - start_time) * 1000},
    }


# ── Converter ─────────────────────────────────────────────────────────────────

def _convert_to_financial_analysis(o: FinancialAnalysisOutput) -> FinancialAnalysis:
    # Normalise salary_milestones
    milestones = []
    for item in (o.salary_milestones or []):
        if isinstance(item, dict):
            milestones.append(item)

    inv_by_cat = {}
    if isinstance(o.investment_by_category, dict):
        inv_by_cat = o.investment_by_category
    elif isinstance(o.investment_by_category, list):
        for it in o.investment_by_category:
            if isinstance(it, dict):
                key = it.get("name") or it.get("category", "Other")
                val = it.get("value") or it.get("amount", 0)
                inv_by_cat[key] = val

    fa = FinancialAnalysis(
        total_investment_required=o.total_investment_required,
        investment_reasoning=o.investment_reasoning,
        break_even_year=o.break_even_year, break_even_month=o.break_even_month,
        break_even_reasoning=o.break_even_reasoning,
        five_year_roi=o.five_year_roi, five_year_roi_reasoning=o.five_year_roi_reasoning,
        ten_year_projected_earnings=o.ten_year_projected_earnings,
        affordability_rating=o.affordability_rating, affordability_reasoning=o.affordability_reasoning,
        affordability_notes=o.affordability_notes,
        cost_saving_opportunities=o.cost_saving_opportunities,
        funding_options=o.funding_options,
        meets_min_salary_target=o.meets_min_salary_target,
        years_to_target_salary=o.years_to_target_salary,
        salary_target_reasoning=o.salary_target_reasoning,
        salary_milestones=milestones, investment_by_category=inv_by_cat,
    )

    for yf in o.yearly_financials:
        yearly = YearlyFinancials(
            year_number=yf.year_number, total_investment=yf.total_investment,
            expected_income=yf.expected_income, income_source=yf.income_source,
            net_cash_flow=yf.net_cash_flow, cumulative_investment=yf.cumulative_investment,
            cumulative_income=yf.cumulative_income,
        )
        for c in yf.costs:
            yearly.cost_breakdown.append(CostBreakdown(
                item_name=c.item_name, amount=c.amount, category=c.category,
                is_recurring=c.is_recurring, frequency=c.frequency,
            ))
        fa.yearly_financials.append(yearly)

    return fa


# ── Fallback ──────────────────────────────────────────────────────────────────

def _create_fallback_financial_analysis(career_path, profile, gap) -> FinancialAnalysis:
    total_years = career_path.total_years if career_path else 5
    fa = FinancialAnalysis(
        total_investment_required=15000.0, break_even_year=2, break_even_month=8,
        five_year_roi=450.0, ten_year_projected_earnings=850000.0,
        affordability_rating="feasible",
        affordability_notes=["Typical career transition range", "Internship income offsets costs", "Consider employer reimbursement", "Investment pays back in 2-3 years"],
        cost_saving_opportunities=["Free resources: freeCodeCamp, Odin Project, CS50", "Tech company scholarships", "Free tiers: AWS, GCP, Azure", "Student discounts", "Study groups"],
        funding_options=["ISAs – pay after getting job", "Tech scholarships (Google, Meta, AWS)", "Government workforce grants", "Low-interest student loans", "Employer tuition reimbursement"],
        meets_min_salary_target=True, years_to_target_salary=3,
    )

    yearly_data = [
        (1, [("Online Courses", 500, "education"), ("Books", 200, "education"), ("Cloud Credits", 100, "tools"), ("Dev Tools", 150, "tools"), ("Cert Prep", 250, "certification")], 0, "None"),
        (2, [("Advanced Courses", 400, "education"), ("AWS Cert", 150, "certification"), ("Pro Tools", 200, "tools"), ("Networking Events", 100, "networking")], 25000, "Internship"),
        (3, [("Pro Certification", 300, "certification"), ("Conference", 500, "networking"), ("Premium Tools", 300, "tools")], 65000, "Full-time"),
        (4, [("Advanced Training", 800, "education"), ("Leadership Dev", 400, "skill")], 85000, "Full-time"),
        (5, [("Continued Education", 500, "education"), ("Industry Certs", 400, "certification")], 110000, "Full-time"),
    ]

    cum_inv = cum_inc = 0
    for yr, costs, income, source in yearly_data[:total_years]:
        total_inv = sum(c[1] for c in costs)
        cum_inv += total_inv
        cum_inc += income
        yearly = YearlyFinancials(
            year_number=yr, total_investment=total_inv, expected_income=income,
            income_source=source, net_cash_flow=income - total_inv,
            cumulative_investment=cum_inv, cumulative_income=cum_inc,
        )
        for name, amt, cat in costs:
            yearly.cost_breakdown.append(CostBreakdown(item_name=name, amount=amt, category=cat, is_recurring=False, frequency="one-time"))
        fa.yearly_financials.append(yearly)

    fa.total_investment_required = cum_inv
    return fa


def _format_career_path(cp) -> str:
    if not cp:
        return "Standard 5-year career path: Year 1 skills → Year 2 internship → Year 3 entry → Year 4 growth → Year 5 senior"
    lines = [f"**{cp.path_label}** ({cp.total_years}y)", f"Target: {cp.final_target_role}", f"Salary: ${cp.final_expected_salary:,.0f}", ""]
    for y in cp.yearly_plans:
        lines.append(f"**{y.year_label}** – {y.primary_focus}")
        if y.expected_role:
            lines.append(f"  Role: {y.expected_role}")
        if y.expected_salary_range:
            lines.append(f"  Salary: {y.expected_salary_range}")
    return "\n".join(lines)
