"""
Career Path Simulator — LangGraph Workflow
Two-Stage Process:
  Stage 1 (Matching): Profile → ProfileParser → CareerMatcher → PAUSE (returns 3 career fits)
  Stage 2 (Simulation): Selected Career → MarketScout → GapAnalyst → Timeline / Financial / Risk → Dashboard
"""

import re
from typing import Literal

from langgraph.graph import StateGraph, START, END

from .models.state import (
    CareerSimulationState,
    CareerMatcherResult,
    CareerFit,
    CareerFitReasoning,
    AlternativeCareer,
    create_initial_state,
)
from .models.career_profile import CareerProfile
from .agents.profile_parser import profile_parser_node
from .agents.career_matcher import career_matcher_node, CareerMatcherOutput
from .agents.market_scout import market_scout_node
from .agents.gap_analyst import gap_analyst_node
from .agents.timeline_simulator import timeline_simulator_node
from .agents.financial_advisor import financial_advisor_node
from .agents.risk_assessor import risk_assessor_node
from .agents.dashboard_formatter import dashboard_formatter_node


# ─── Stage 1: Career Matching ────────────────────────────────────────────────

def build_career_matching_graph() -> StateGraph:
    """
    Stage 1 graph: Profile analysis → Career matching.
    START → ProfileParser → CareerMatcher → END
    Pauses after returning 3 career fits so the user can select one.
    """
    workflow = StateGraph(CareerSimulationState)

    workflow.add_node("profile_parser", profile_parser_node)
    workflow.add_node("career_matcher", _career_matcher_wrapper)

    workflow.add_edge(START, "profile_parser")
    workflow.add_edge("profile_parser", "career_matcher")
    workflow.add_edge("career_matcher", END)

    return workflow


def _career_matcher_wrapper(state: CareerSimulationState) -> dict:
    """Run the career-matcher node and convert its Pydantic output to state models."""
    result = career_matcher_node(state)

    matcher_output = result.get("career_fits")
    if matcher_output and isinstance(matcher_output, CareerMatcherOutput):
        career_fits: list[CareerFit] = []
        for fit in matcher_output.career_fits:
            career_fits.append(
                CareerFit(
                    rank=fit.rank,
                    career_title=fit.career_title,
                    career_field=fit.career_field,
                    overall_fit_score=fit.overall_fit_score,
                    skill_fit_score=fit.skill_fit_score,
                    interest_fit_score=fit.interest_fit_score,
                    market_fit_score=fit.market_fit_score,
                    personality_fit_score=fit.personality_fit_score,
                    tagline=fit.tagline,
                    reasoning=CareerFitReasoning(
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

        matcher_result = CareerMatcherResult(
            analysis_summary=matcher_output.analysis_summary,
            profile_highlights=matcher_output.profile_highlights,
            career_fits=career_fits,
            methodology_explanation=matcher_output.methodology_explanation,
            confidence_level=matcher_output.confidence_level,
            confidence_reasoning=matcher_output.confidence_reasoning,
        )

        return {
            "career_matcher_result": matcher_result,
            "stage": "matching_complete",
            "current_node": result.get("current_node", "career_matcher"),
            "processing_time_ms": result.get("processing_time_ms", {}),
        }

    return result


# ─── Stage 2: Full Simulation ────────────────────────────────────────────────

def should_suggest_alternatives(
    state: CareerSimulationState,
) -> Literal["suggest_alternatives", "simulate_timeline"]:
    """Conditional edge: if gap > 80 % → suggest alternatives first."""
    if state.get("should_suggest_alternatives"):
        return "suggest_alternatives"
    return "simulate_timeline"


def alternative_path_suggester_node(state: CareerSimulationState) -> dict:
    """Suggest alternative careers when the gap is too large (> 80 %)."""
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from .agents.base import get_llm

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a career counselor. When a target career has a very high gap "
                "score (> 80 %), suggest 3-5 alternative careers that are more achievable "
                "while still aligned with the user's interests.\n\n"
                "For each alternative provide:\n"
                "1. Why it's a better fit given current skills\n"
                "2. How it relates to original interests\n"
                "3. A realistic path to entry\n"
                "4. Expected challenges and mitigations",
            ),
            (
                "human",
                "Gap score: {gap_score}/100 for {target_career}\n\n"
                "Profile: {profile_summary}\n"
                "Skills: {current_skills}\n"
                "Original Target: {target_roles} in {target_fields}\n\n"
                "Key Gaps:\n{key_gaps}\n\n"
                "Suggest 3-5 alternatives in this format:\n\n"
                "ALTERNATIVE 1:\n"
                "- ROLE: [Role]\n"
                "- FIELD: [Field]\n"
                "- SIMILARITY: [0-100%]\n"
                "- REASONING: [2-3 sentences]\n"
                "- GAP SCORE: [0-100]\n"
                "- TRANSITION: [Easy/Moderate/Challenging]\n"
                "- PATH TO ENTRY: [Brief roadmap]",
            ),
        ]
    )

    profile = state["career_profile"]
    normalized = state.get("normalized_profile")
    gap = state.get("gap_analysis")
    selected = state.get("selected_career")

    key_gaps: list[str] = []
    if gap:
        if gap.education_gap:
            key_gaps.append(f"Education: {gap.education_gap}")
        for s in gap.technical_skill_gaps[:3]:
            key_gaps.append(f"Skill: {s.skill_name} ({s.gap_severity}/100)")
        for b in gap.critical_bottlenecks[:2]:
            key_gaps.append(f"Bottleneck: {b}")

    llm = get_llm(temperature=0.5)
    chain = prompt | llm | StrOutputParser()

    response = chain.invoke(
        {
            "gap_score": gap.overall_gap_score if gap else 85,
            "target_career": selected.career_title if selected else "Target Role",
            "profile_summary": (
                normalized.profile_summary if normalized else "Not available"
            ),
            "current_skills": (
                str(normalized.combined_technical_skills)
                if normalized
                else "Not assessed"
            ),
            "target_roles": (
                selected.career_title
                if selected
                else (
                    ", ".join(profile.specific_roles)
                    if profile.specific_roles
                    else "Not specified"
                )
            ),
            "target_fields": (
                selected.career_field
                if selected
                else (
                    ", ".join(profile.target_career_fields)
                    if profile.target_career_fields
                    else "Not specified"
                )
            ),
            "key_gaps": "\n".join(key_gaps) if key_gaps else "Multiple significant gaps",
        }
    )

    alternatives = _parse_alternatives(response)

    career_label = selected.career_title if selected else "target career"
    score = gap.overall_gap_score if gap else 85
    warnings = [
        f"High gap score ({score:.0f}/100) detected for {career_label}. "
        "Alternative career paths have been suggested alongside your original target."
    ]

    return {
        "alternative_careers": alternatives,
        "warnings": warnings,
        "current_node": "alternative_suggester",
    }


def _parse_alternatives(response: str) -> list[AlternativeCareer]:
    """Parse LLM free-text into a list of ``AlternativeCareer`` models."""
    alternatives: list[AlternativeCareer] = []
    sections = re.split(r"ALTERNATIVE\s*\d+:", response, flags=re.IGNORECASE)

    for section in sections[1:]:
        alt = AlternativeCareer(
            role_title="",
            field="",
            similarity_to_original=50.0,
            gap_score=50.0,
            transition_difficulty="Moderate",
        )

        for line in section.split("\n"):
            line = line.strip()
            if not line or ":" not in line:
                continue
            key, value = line.split(":", 1)
            key = key.strip().upper().lstrip("-").strip()
            value = value.strip().strip("[]")

            if "ROLE" in key:
                alt.role_title = value
            elif "FIELD" in key:
                alt.field = value
            elif "SIMILARITY" in key:
                nums = re.findall(r"\d+(?:\.\d+)?", value)
                if nums:
                    alt.similarity_to_original = float(nums[0])
            elif "REASONING" in key:
                alt.reasons_suggested = [r.strip() for r in value.split(".") if r.strip()]
            elif "GAP" in key and "SCORE" in key:
                nums = re.findall(r"\d+(?:\.\d+)?", value)
                if nums:
                    alt.gap_score = float(nums[0])
            elif "TRANSITION" in key:
                if value in ("Easy", "Moderate", "Challenging"):
                    alt.transition_difficulty = value

        if alt.role_title:
            alternatives.append(alt)

    return alternatives[:5]


def build_simulation_graph() -> StateGraph:
    """
    Stage 2 graph — full simulation for the selected career.
    START → MarketScout → GapAnalyst
        → (conditional) alternatives | timeline
        → TimelineSimulator → Parallel(Financial, Risk) → Dashboard → END
    """
    workflow = StateGraph(CareerSimulationState)

    workflow.add_node("market_scout", market_scout_node)
    workflow.add_node("gap_analyst", gap_analyst_node)
    workflow.add_node("alternative_suggester", alternative_path_suggester_node)
    workflow.add_node("timeline_simulator", timeline_simulator_node)
    workflow.add_node("financial_advisor", financial_advisor_node)
    workflow.add_node("risk_assessor", risk_assessor_node)
    workflow.add_node("dashboard_formatter", dashboard_formatter_node)

    workflow.add_edge(START, "market_scout")
    workflow.add_edge("market_scout", "gap_analyst")

    workflow.add_conditional_edges(
        "gap_analyst",
        should_suggest_alternatives,
        {
            "suggest_alternatives": "alternative_suggester",
            "simulate_timeline": "timeline_simulator",
        },
    )

    workflow.add_edge("alternative_suggester", "timeline_simulator")

    # Parallel fan-out
    workflow.add_edge("timeline_simulator", "financial_advisor")
    workflow.add_edge("timeline_simulator", "risk_assessor")

    # Fan-in → dashboard
    workflow.add_edge("financial_advisor", "dashboard_formatter")
    workflow.add_edge("risk_assessor", "dashboard_formatter")

    workflow.add_edge("dashboard_formatter", END)

    return workflow


# ─── Compilation helpers ─────────────────────────────────────────────────────

def compile_career_matching():
    """Compile Stage 1 graph."""
    return build_career_matching_graph().compile()


def compile_career_simulation():
    """Compile Stage 2 graph."""
    return build_simulation_graph().compile()


# ─── Execution functions ─────────────────────────────────────────────────────

def run_career_matching(profile_data: dict) -> dict:
    """Stage 1 (sync): parse profile → return 3 career fits."""
    profile = CareerProfile(**profile_data)
    initial_state = create_initial_state(profile)
    graph = compile_career_matching()
    return graph.invoke(initial_state)


async def run_career_matching_async(profile_data: dict) -> dict:
    """Stage 1 (async)."""
    profile = CareerProfile(**profile_data)
    initial_state = create_initial_state(profile)
    graph = compile_career_matching()
    return await graph.ainvoke(initial_state)


def run_career_simulation_for_selected(
    state: dict, career_index: int
) -> dict:
    """
    Stage 2 (sync): run full simulation for the chosen career.

    Parameters
    ----------
    state : dict
        State returned by Stage 1 (contains ``career_matcher_result``).
    career_index : int
        The index (0-2) of the career the user selected.
    """
    matcher_result = state.get("career_matcher_result")
    if not matcher_result or not matcher_result.career_fits:
        raise ValueError("No career fits available. Run Stage 1 first.")
    if career_index < 0 or career_index >= len(matcher_result.career_fits):
        raise ValueError(f"Invalid career index: {career_index}")

    selected_career = matcher_result.career_fits[career_index]
    state["selected_career_index"] = career_index
    state["selected_career"] = selected_career
    state["stage"] = "simulation"

    profile: CareerProfile = state["career_profile"]
    profile.specific_roles = [selected_career.career_title]
    profile.target_career_fields = [selected_career.career_field]

    graph = compile_career_simulation()
    return graph.invoke(state)


async def run_career_simulation_for_selected_async(
    state: dict, career_index: int
) -> dict:
    """Stage 2 (async): full simulation for the selected career."""
    matcher_result = state.get("career_matcher_result")
    if not matcher_result or not matcher_result.career_fits:
        raise ValueError("No career fits available. Run Stage 1 first.")
    if career_index < 0 or career_index >= len(matcher_result.career_fits):
        raise ValueError(f"Invalid career index: {career_index}")

    selected_career = matcher_result.career_fits[career_index]
    state["selected_career_index"] = career_index
    state["selected_career"] = selected_career
    state["stage"] = "simulation"

    profile: CareerProfile = state["career_profile"]
    profile.specific_roles = [selected_career.career_title]
    profile.target_career_fields = [selected_career.career_field]

    graph = compile_career_simulation()
    return await graph.ainvoke(state)
