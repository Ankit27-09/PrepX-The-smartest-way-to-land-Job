"""
Node G: DashboardFormatter Agent
The UI Mapper – Converts simulation data to frontend-ready JSON.
Pure data transformation, NO LLM calls.
"""

import re
import time
import uuid
from ..models.state import (
    CareerSimulationState,
    DashboardData,
    DashboardMilestone,
    SkillNode,
)


def dashboard_formatter_node(state: CareerSimulationState) -> dict:
    """Node G: Convert simulation data into structured JSON for frontend."""
    start_time = time.time()
    d = DashboardData()

    d.milestones, d.milestone_connections = _format_milestones(state)
    d.skill_nodes = _format_skill_tree(state)
    d.salary_progression = _salary_progression(state)
    d.cost_vs_income = _cost_income(state)
    d.skill_radar = _skill_radar(state)
    d.risk_breakdown = _risk_breakdown(state)
    d.gap_analysis_chart = _gap_chart(state)
    d.investment_breakdown = _investment_breakdown(state)
    d.timeline_progress = _timeline_progress(state)
    d.monthly_projection = _monthly_projection(state)
    d.path_comparison = _path_comparison(state)

    risk = state.get("risk_assessment")
    if risk:
        d.success_probability_gauge = risk.success_probability_score

    d.summary_stats = _summary_stats(state)
    d.key_metrics = _key_metrics(state)
    d.timeline_events = _timeline_events(state)
    d.key_insights = _key_insights(state)
    d.decision_rationale = _decision_rationale(state)
    d.top_recommendations = _top_recommendations(state)
    d.immediate_actions = _immediate_actions(state)
    d.risk_indicators = _risk_indicators(state)
    d.selected_career_summary = _selected_career_summary(state)

    final_summary = _final_summary(state)
    processing_time = (time.time() - start_time) * 1000

    return {
        "dashboard_data": d,
        "simulation_complete": True,
        "final_report_summary": final_summary,
        "current_node": "dashboard_formatter",
        "processing_time_ms": {"dashboard_formatter": processing_time},
    }


# ── Milestones for React Flow ────────────────────────────────────────────────

def _format_milestones(state) -> tuple[list[DashboardMilestone], list[dict]]:
    milestones: list[DashboardMilestone] = []
    connections: list[dict] = []
    tl = state.get("timeline_simulation")
    if not tl:
        return milestones, connections

    path = tl.realistic_path
    if tl.recommended_path == "conservative" and tl.conservative_path:
        path = tl.conservative_path
    elif tl.recommended_path == "ambitious" and tl.ambitious_path:
        path = tl.ambitious_path
    if not path:
        return milestones, connections

    prev_id = None
    for year in path.yearly_plans:
        x_base = (year.year_number - 1) * 400
        year_id = f"year_{year.year_number}"
        milestones.append(DashboardMilestone(
            id=year_id, title=year.year_label, description=year.primary_focus,
            year=year.year_number, quarter=0, type="year_header", status="pending",
            position={"x": x_base, "y": 0},
        ))
        if prev_id:
            connections.append({"id": f"conn_{prev_id}_{year_id}", "source": prev_id, "target": year_id})

        for m in year.milestones:
            m_id = f"m_{year.year_number}_{m.quarter}_{uuid.uuid4().hex[:6]}"
            milestones.append(DashboardMilestone(
                id=m_id, title=m.title, description=m.description,
                year=year.year_number, quarter=m.quarter, type=m.type, status="pending",
                position={"x": x_base + m.quarter * 80, "y": 100 + (m.quarter - 1) * 60},
            ))
            connections.append({"id": f"conn_{year_id}_{m_id}", "source": year_id, "target": m_id})
        prev_id = year_id

    return milestones, connections


# ── Skill tree ────────────────────────────────────────────────────────────────

def _format_skill_tree(state) -> list[SkillNode]:
    nodes: list[SkillNode] = []
    gap = state.get("gap_analysis")
    if not gap:
        return nodes

    level_map = {"none": 0, "basic": 1, "beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4, "master": 5}

    for i, sg in enumerate(gap.technical_skill_gaps):
        nodes.append(SkillNode(
            id=f"skill_{i}", name=sg.skill_name,
            current_level=level_map.get(sg.current_level.lower(), 0),
            target_level=level_map.get(sg.required_level.lower(), 3),
            category="technical", resources=sg.recommended_resources,
            estimated_time=sg.estimated_time_to_close,
        ))
    for i, sg in enumerate(gap.soft_skill_gaps):
        nodes.append(SkillNode(
            id=f"soft_skill_{i}", name=sg.skill_name,
            current_level=level_map.get(sg.current_level.lower(), 0),
            target_level=level_map.get(sg.required_level.lower(), 3),
            category="soft", resources=sg.recommended_resources,
            estimated_time=sg.estimated_time_to_close,
        ))
    return nodes


# ── Charts ────────────────────────────────────────────────────────────────────

def _extract_salary(s: str, year: int) -> float:
    if not s:
        return 50000 + year * 15000
    nums = re.findall(r"[\d,]+", s.replace(",", ""))
    return sum(float(n) for n in nums) / max(len(nums), 1) if nums else 50000 + year * 15000


def _salary_progression(state) -> list[dict]:
    tl = state.get("timeline_simulation")
    if not tl:
        return []
    data = []
    paths = {"conservative": tl.conservative_path, "realistic": tl.realistic_path, "ambitious": tl.ambitious_path}
    for yn in range(1, 6):
        row = {"year": f"Year {yn}"}
        for name, p in paths.items():
            if p and p.yearly_plans:
                yp = next((y for y in p.yearly_plans if y.year_number == yn), None)
                row[name] = _extract_salary(yp.expected_salary_range, yn) if yp else 50000 + yn * 15000
            else:
                row[name] = 50000 + yn * 15000
        data.append(row)
    return data


def _cost_income(state) -> list[dict]:
    fa = state.get("financial_analysis")
    if not fa or not fa.yearly_financials:
        return []
    return [{"year": f"Year {y.year_number}", "investment": y.total_investment, "income": y.expected_income,
             "net": y.net_cash_flow, "cumulative_investment": y.cumulative_investment, "cumulative_income": y.cumulative_income}
            for y in fa.yearly_financials]


def _skill_radar(state) -> list[dict]:
    gap = state.get("gap_analysis")
    if not gap:
        return []
    pct = {"none": 0, "basic": 25, "beginner": 25, "intermediate": 50, "advanced": 75, "expert": 100}
    return [{"skill": sg.skill_name[:12], "current": pct.get(sg.current_level.lower(), 0),
             "required": pct.get(sg.required_level.lower(), 75), "fullName": sg.skill_name}
            for sg in gap.technical_skill_gaps[:6]]


def _risk_breakdown(state) -> list[dict]:
    r = state.get("risk_assessment")
    if not r:
        return []
    return [
        {"name": "Market Risk", "value": r.market_risk_score, "fill": "#8884d8"},
        {"name": "Personal Risk", "value": r.personal_risk_score, "fill": "#82ca9d"},
        {"name": "Financial Risk", "value": r.financial_risk_score, "fill": "#ffc658"},
        {"name": "Technical Risk", "value": r.technical_risk_score, "fill": "#ff7300"},
    ]


def _gap_chart(state) -> list[dict]:
    gap = state.get("gap_analysis")
    if not gap:
        return []
    return [{"skill": sg.skill_name[:15], "gap": sg.gap_severity,
             "priority": getattr(sg, "priority", "medium"), "time": sg.estimated_time_to_close}
            for sg in gap.technical_skill_gaps[:8]]


def _investment_breakdown(state) -> list[dict]:
    fa = state.get("financial_analysis")
    if not fa:
        return []
    cats: dict[str, float] = {}
    for yf in fa.yearly_financials:
        for c in yf.cost_breakdown:
            cats[c.category.title()] = cats.get(c.category.title(), 0) + c.amount
    colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28"]
    return [{"name": cat, "value": amt, "fill": colors[i % len(colors)]} for i, (cat, amt) in enumerate(cats.items())]


def _timeline_progress(state) -> list[dict]:
    tl = state.get("timeline_simulation")
    if not tl or not tl.realistic_path:
        return []
    return [{"task": m.title[:30], "year": y.year_number, "quarter": m.quarter, "type": m.type,
             "duration": m.estimated_hours, "cost": m.estimated_cost}
            for y in tl.realistic_path.yearly_plans for m in y.milestones]


def _monthly_projection(state) -> list[dict]:
    fa = state.get("financial_analysis")
    if not fa or not fa.yearly_financials:
        return []
    data = []
    for yf in fa.yearly_financials[:2]:
        mc, mi = yf.total_investment / 12, yf.expected_income / 12
        for mo in range(1, 13):
            data.append({"month": f"M{(yf.year_number - 1) * 12 + mo}", "cost": round(mc), "income": round(mi), "net": round(mi - mc)})
    return data


def _path_comparison(state) -> list[dict]:
    tl = state.get("timeline_simulation")
    if not tl or not all([tl.conservative_path, tl.realistic_path, tl.ambitious_path]):
        return []
    c, r, a = tl.conservative_path, tl.realistic_path, tl.ambitious_path
    fmt = lambda v: f"${v / 1e6:.1f}M" if v >= 1e6 else f"${v / 1e3:.0f}K" if v >= 1e3 else f"${v:.0f}"
    return [
        {"metric": "Timeline", "conservative": f"{c.total_years}y", "realistic": f"{r.total_years}y", "ambitious": f"{a.total_years}y"},
        {"metric": "Final Salary", "conservative": fmt(c.final_expected_salary), "realistic": fmt(r.final_expected_salary), "ambitious": fmt(a.final_expected_salary)},
        {"metric": "Risk Level", "conservative": "Low", "realistic": "Medium", "ambitious": "High"},
        {"metric": "Recommended", "conservative": "✓" if tl.recommended_path == "conservative" else "", "realistic": "✓" if tl.recommended_path == "realistic" else "", "ambitious": "✓" if tl.recommended_path == "ambitious" else ""},
    ]


# ── Summary & Insights ───────────────────────────────────────────────────────

def _summary_stats(state) -> dict:
    s: dict = {}
    r = state.get("risk_assessment")
    if r:
        s["success_probability"] = f"{r.success_probability_score:.0f}%"
        s["confidence_interval"] = r.confidence_interval
        s["compared_to_average"] = r.compared_to_average
    fa = state.get("financial_analysis")
    if fa:
        s["total_investment"] = f"${fa.total_investment_required:,.0f}"
        s["break_even_year"] = f"Year {fa.break_even_year}"
        s["roi_5_year"] = f"{fa.five_year_roi:.0f}%"
        s["affordability"] = fa.affordability_rating.title()
    gap = state.get("gap_analysis")
    if gap:
        s["gap_score"] = f"{gap.overall_gap_score:.0f}/100"
        s["gap_category"] = gap.gap_category.title()
        s["skill_gaps_count"] = len(gap.technical_skill_gaps)
    tl = state.get("timeline_simulation")
    if tl and tl.realistic_path:
        p = tl.realistic_path
        s["timeline_years"] = f"{p.total_years} Years"
        s["target_role"] = p.final_target_role
        s["expected_salary"] = f"${p.final_expected_salary:,.0f}"
    n = state.get("normalized_profile")
    if n:
        s["persona"] = n.persona_type
        s["academic_score"] = f"{n.academic_strength_score:.0f}/100"
    return s


def _key_metrics(state) -> list[dict]:
    metrics = []
    r = state.get("risk_assessment")
    if r:
        metrics.append({"title": "Success Rate", "value": f"{r.success_probability_score:.0f}%",
                         "description": (r.success_reasoning or "Based on profile")[:100], "type": "success", "icon": "target"})
    fa = state.get("financial_analysis")
    if fa:
        metrics.append({"title": "Total Investment", "value": f"${fa.total_investment_required:,.0f}",
                         "description": (fa.investment_reasoning or "Courses, certifications, tools")[:100], "type": "financial", "icon": "dollar"})
        metrics.append({"title": "5-Year ROI", "value": f"{fa.five_year_roi:.0f}%",
                         "description": (fa.five_year_roi_reasoning or "Return on investment")[:100], "type": "roi", "icon": "trending"})
    tl = state.get("timeline_simulation")
    if tl and tl.realistic_path:
        metrics.append({"title": "Timeline", "value": f"{tl.realistic_path.total_years} Years",
                         "description": (tl.recommendation_reason or "Estimated time")[:100], "type": "timeline", "icon": "calendar"})
    return metrics


def _timeline_events(state) -> list[dict]:
    tl = state.get("timeline_simulation")
    if not tl or not tl.realistic_path:
        return []
    events = []
    for y in tl.realistic_path.yearly_plans:
        events.append({"id": f"year_{y.year_number}", "title": y.year_label, "description": y.primary_focus,
                        "year": y.year_number, "phase": y.phase, "type": "year",
                        "expected_role": y.expected_role, "expected_salary": y.expected_salary_range,
                        "reasoning": getattr(y, "phase_reasoning", "")})
        for m in y.milestones:
            events.append({"id": f"milestone_{y.year_number}_{m.quarter}", "title": m.title,
                            "description": m.description, "year": y.year_number, "quarter": m.quarter,
                            "type": m.type, "cost": m.estimated_cost, "hours": m.estimated_hours,
                            "reasoning": getattr(m, "reasoning", "")})
    return events


def _key_insights(state) -> list[dict]:
    insights = []
    gap = state.get("gap_analysis")
    if gap:
        insights.append({"title": "Skills Gap", "insight": f"Score: {gap.overall_gap_score:.0f}/100 ({gap.gap_category})",
                          "reasoning": getattr(gap, "analysis_reasoning", "")[:200], "type": "gap",
                          "priority": "high" if gap.overall_gap_score > 50 else "medium"})
        if gap.existing_strengths:
            insights.append({"title": "Your Strengths", "insight": ", ".join(gap.existing_strengths[:3]),
                              "reasoning": "Accelerate your transition", "type": "strength", "priority": "positive"})
    r = state.get("risk_assessment")
    if r:
        insights.append({"title": "Success Probability", "insight": f"{r.success_probability_score:.0f}% ({r.confidence_interval})",
                          "reasoning": (r.success_reasoning or "")[:200], "type": "risk",
                          "priority": "high" if r.success_probability_score < 60 else "medium"})
        if r.key_opportunities:
            insights.append({"title": "Key Opportunity", "insight": r.key_opportunities[0],
                              "reasoning": "Capitalize on this", "type": "opportunity", "priority": "positive"})
    fa = state.get("financial_analysis")
    if fa:
        insights.append({"title": "Financial Outlook", "insight": f"Break-even Year {fa.break_even_year}, {fa.five_year_roi:.0f}% 5yr ROI",
                          "reasoning": (fa.break_even_reasoning or "")[:200], "type": "financial", "priority": "medium"})
    return insights


def _decision_rationale(state) -> list[dict]:
    rationale = []
    tl = state.get("timeline_simulation")
    if tl:
        rationale.append({"decision": f"Path: {tl.recommended_path.title()}", "why": tl.recommendation_reason or "Best fit",
                           "impact": "Balances achievability with goals"})
    sel = state.get("selected_career")
    if sel:
        rationale.append({"decision": f"Career: {sel.career_title}", "why": sel.reasoning.why_now if sel.reasoning else "Best fit",
                           "impact": f"Expected: {sel.typical_salary_range}"})
    return rationale


def _top_recommendations(state) -> list[str]:
    recs = []
    r = state.get("risk_assessment")
    if r:
        recs.extend((r.recommendations or r.risk_mitigation_plan)[:3])
    gap = state.get("gap_analysis")
    if gap and gap.top_priorities:
        recs.extend(gap.top_priorities[:2])
    return recs[:5]


def _immediate_actions(state) -> list[dict]:
    actions = []
    gap = state.get("gap_analysis")
    if gap:
        for qw in (gap.quick_wins or [])[:2]:
            actions.append({"action": qw, "priority": "high", "timeframe": "This week", "impact": "Quick progress"})
        if gap.technical_skill_gaps:
            sg = gap.technical_skill_gaps[0]
            actions.append({"action": f"Start learning {sg.skill_name}", "priority": "high",
                             "timeframe": sg.estimated_time_to_close, "impact": f"Close {sg.gap_severity:.0f}% gap"})
    tl = state.get("timeline_simulation")
    if tl and tl.realistic_path and tl.realistic_path.yearly_plans:
        yp = tl.realistic_path.yearly_plans[0]
        if yp.milestones:
            fm = yp.milestones[0]
            actions.append({"action": fm.title, "priority": "medium", "timeframe": f"Q{fm.quarter}",
                             "impact": fm.description[:50]})
    return actions[:5]


def _risk_indicators(state) -> list[dict]:
    r = state.get("risk_assessment")
    if not r:
        return []
    return [{"name": rf.factor_name, "category": rf.category, "severity": rf.severity,
             "probability": rf.probability, "impact": rf.impact_description,
             "reasoning": getattr(rf, "reasoning", ""),
             "mitigation": rf.mitigation_strategies[0] if rf.mitigation_strategies else ""}
            for rf in r.risk_factors[:6]]


def _selected_career_summary(state) -> dict:
    sel = state.get("selected_career")
    if not sel:
        return {}
    return {"title": sel.career_title, "field": sel.career_field,
            "fit_score": sel.overall_fit_score, "skill_fit": sel.skill_fit_score,
            "interest_fit": sel.interest_fit_score, "market_fit": sel.market_fit_score,
            "salary_range": sel.typical_salary_range, "time_to_entry": sel.time_to_entry,
            "top_reasons": sel.top_3_reasons}


# ── Final Summary Report ─────────────────────────────────────────────────────

def _final_summary(state) -> str:
    profile = state["career_profile"]
    norm = state.get("normalized_profile")
    tl = state.get("timeline_simulation")
    r = state.get("risk_assessment")
    fa = state.get("financial_analysis")
    sel = state.get("selected_career")

    target = sel.career_title if sel else (profile.specific_roles[0] if profile.specific_roles else "your target role")
    parts = [f"# Career Path Simulation Report: {target}\n"]

    if norm:
        parts.append(f"**Profile Type:** {norm.persona_type}\n")
    if r:
        parts.append(f"**Success Probability:** {r.success_probability_score:.0f}% (Confidence: {r.confidence_interval})\n")
        if r.success_reasoning:
            parts.append(f"*Why:* {r.success_reasoning}\n")
    if sel:
        parts.append(f"\n## Selected Career: {sel.career_title}\n- Fit: {sel.overall_fit_score:.0f}%\n- Salary: {sel.typical_salary_range}\n- Entry: {sel.time_to_entry}\n")
        if sel.top_3_reasons:
            parts.extend(f"  - {reason}\n" for reason in sel.top_3_reasons)
    if tl and tl.realistic_path:
        p = tl.realistic_path
        parts.append(f"\n## Recommended Path: {p.path_label}\n- Duration: {p.total_years}y\n- Target: {p.final_target_role}\n- Salary: ${p.final_expected_salary:,.0f}\n")
        if tl.recommendation_reason:
            parts.append(f"*Why:* {tl.recommendation_reason}\n")
    if fa:
        parts.append(f"\n## Financial Summary\n- Investment: ${fa.total_investment_required:,.0f}\n- Break-Even: Year {fa.break_even_year}\n- 5yr ROI: {fa.five_year_roi:.0f}%\n- Affordability: {fa.affordability_rating.title()}\n")
    if r and r.risk_factors:
        parts.append("\n## Key Risks\n")
        for rf in r.risk_factors[:3]:
            parts.append(f"- **{rf.factor_name}** ({rf.severity}): {rf.impact_description}\n")
            if rf.mitigation_strategies:
                parts.append(f"  *Mitigation:* {rf.mitigation_strategies[0]}\n")
    if r:
        for attr, label in [("best_case_scenario", "Best Case"), ("most_likely_scenario", "Most Likely"), ("worst_case_scenario", "Worst Case")]:
            val = getattr(r, attr, "")
            if val:
                parts.append(f"\n**{label}:** {val}\n")
    if tl and tl.vibe_check_warnings:
        parts.append("\n## Important Considerations\n")
        parts.extend(f"- {w}\n" for w in tl.vibe_check_warnings[:3])

    return "".join(parts)
