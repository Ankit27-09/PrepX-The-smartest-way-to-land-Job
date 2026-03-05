"""
Node B: MarketScout Agent
The RAG Retriever – fetches real-time market data for career fields.
"""

import os
import re
import time
from datetime import datetime
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from ..models.state import CareerSimulationState
from ..models.career_profile import (
    MarketInsights,
    JobMarketInsight,
    MarketRequirement,
    SalaryRange,
)
from .base import get_llm


MARKET_ANALYSIS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert labor market analyst with deep knowledge of global job markets, salary trends, and career requirements.
Provide accurate, actionable insights. Be specific about hard requirements vs nice-to-haves, realistic salaries by experience level, demand and competition levels, required education and certifications.
Base your analysis on the search results provided plus your general knowledge."""),
    ("human", """Analyze the job market for:

**Target Roles:** {target_roles}
**Target Fields:** {target_fields}
**Country:** {country}
**Relocate:** {relocate}

**Search Results:**
{search_results}

For EACH target role provide:
---
### ROLE: [Name]
**FIELD:** [Industry]
**HARD REQUIREMENTS:** (bullets)
**SOFT REQUIREMENTS:** (bullets)
**SALARY RANGES ({country}):**
- Entry Level: $XX - $XX
- Mid Level: $XX - $XX
- Senior Level: $XX - $XX
**MARKET DEMAND:** [Low/Medium/High/Very High]
**GROWTH OUTLOOK:** [Declining/Stable/Growing/Booming]
**COMPETITION LEVEL:** [Low/Medium/High/Intense]
**EDUCATION REQUIREMENTS:** Minimum / Preferred / Certifications
**TYPICAL ENTRY EXPERIENCE:** [e.g. 0-2 years]
**EMERGING SKILLS:** [list]
**DECLINING SKILLS:** [list]
---
Then provide:
**INDUSTRY OVERVIEW:** 2-3 sentences
**TOP HIRING COMPANIES:** 5-10
**ALTERNATIVE ROLES TO CONSIDER:** 2-3""")
])


# ── Search helpers ────────────────────────────────────────────────────────────

async def _search_market_data(roles: list[str], fields: list[str], country: str) -> str:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return _placeholder(roles, fields, country)

    from langchain_community.tools.tavily_search import TavilySearchResults
    search_tool = TavilySearchResults(max_results=5, api_key=api_key)
    results: list[str] = []

    for role in roles[:3]:
        query = f"{role} job requirements salary {country} 2024 2025"
        try:
            hits = search_tool.invoke(query)
            if hits:
                results.append(f"\n### Results for '{role}':\n")
                for r in hits:
                    content = r.get("content", str(r))[:500] if isinstance(r, dict) else str(r)[:500]
                    results.append(f"- {content}\n")
        except Exception as e:
            results.append(f"- Error: {e}\n")

    for field in fields[:2]:
        query = f"{field} industry trends hiring outlook {country} 2025"
        try:
            hits = search_tool.invoke(query)
            if hits:
                results.append(f"\n### Trends for '{field}':\n")
                for r in hits:
                    content = r.get("content", str(r))[:500] if isinstance(r, dict) else str(r)[:500]
                    results.append(f"- {content}\n")
        except Exception as e:
            results.append(f"- Error: {e}\n")

    return "".join(results) if results else _placeholder(roles, fields, country)


def _placeholder(roles, fields, country):
    return f"""### General Market Data (placeholder – configure TAVILY_API_KEY for live search)
Roles: {', '.join(roles)} | Fields: {', '.join(fields)} | Country: {country}
- Software Engineers remain in high demand globally
- Entry-level tech in US: $60k-$100k; Mid: $100k-$150k; Senior: $150k-$250k+
- Certifications in cloud (AWS, Azure, GCP) are valuable
- Bachelor's degree in related field often required
"""


# ── Node ──────────────────────────────────────────────────────────────────────

def market_scout_node(state: CareerSimulationState) -> dict:
    """Node B: Fetch real-time market data and analyze job market conditions."""
    start_time = time.time()
    profile = state["career_profile"]

    target_roles = profile.specific_roles or ["Software Engineer"]
    target_fields = profile.target_career_fields or ["Technology"]
    country = profile.current_country or "United States"
    relocate = profile.willingness_to_relocate or "Within Country"

    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    search_results = loop.run_until_complete(
        _search_market_data(target_roles, target_fields, country)
    )

    llm = get_llm(temperature=0.3)
    chain = MARKET_ANALYSIS_PROMPT | llm | StrOutputParser()
    analysis = chain.invoke({
        "target_roles": ", ".join(target_roles),
        "target_fields": ", ".join(target_fields),
        "country": country,
        "relocate": relocate,
        "search_results": search_results,
    })

    market_insights = _parse_market_analysis(analysis, target_roles, target_fields, country)
    processing_time = (time.time() - start_time) * 1000

    return {
        "market_insights": market_insights,
        "current_node": "market_scout",
        "processing_time_ms": {"market_scout": processing_time},
    }


# ── Parsing helpers ───────────────────────────────────────────────────────────

def _parse_market_analysis(analysis: str, roles: list[str], fields: list[str], country: str) -> MarketInsights:
    target_insights: list[JobMarketInsight] = []
    alt_insights: list[JobMarketInsight] = []
    companies: list[str] = []
    health = "Stable"

    for section in analysis.split("### ROLE:")[1:]:
        insight = _parse_role_section(section, country)
        if insight:
            if any(r.lower() in insight.role_title.lower() for r in roles):
                target_insights.append(insight)
            else:
                alt_insights.append(insight)

    if not target_insights:
        for role in roles:
            field = fields[0] if fields else "Technology"
            target_insights.append(_default_insight(role, field, country))

    au = analysis.upper()
    if "INDUSTRY OVERVIEW:" in au:
        snippet = analysis[au.find("INDUSTRY OVERVIEW:"):au.find("INDUSTRY OVERVIEW:") + 500].lower()
        if "growing" in snippet or "booming" in snippet:
            health = "Growing"
        elif "declining" in snippet:
            health = "Declining"

    if "TOP HIRING COMPANIES:" in au:
        idx = au.find("TOP HIRING COMPANIES:")
        for line in analysis[idx:idx + 300].split("\n")[1:6]:
            c = line.strip().strip("-•").strip()
            if c and len(c) > 2:
                companies.append(c)

    return MarketInsights(
        target_roles=target_insights,
        alternative_roles=alt_insights[:3],
        target_country=country,
        regional_demand_modifier=_regional_mod(country),
        industry_health=health,
        top_hiring_companies=companies[:10],
        data_timestamp=datetime.now(),
        data_sources=["Tavily Search", "LLM Analysis"],
    )


def _parse_role_section(section: str, country: str) -> Optional[JobMarketInsight]:
    lines = section.split("\n")
    if not lines:
        return None
    role_title = lines[0].strip().strip("[]")
    if not role_title:
        return None

    insight = JobMarketInsight(role_title=role_title, field="")
    current_section = None

    for line in lines:
        lu = line.upper().strip()
        ls = line.strip()
        if "**FIELD:**" in lu or "FIELD:" in lu:
            insight.field = ls.split(":")[-1].strip().strip("*[]")
        elif "HARD REQUIREMENTS" in lu:
            current_section = "hard"
        elif "SOFT REQUIREMENTS" in lu or "NICE-TO-HAVE" in lu:
            current_section = "soft"
        elif "SALARY" in lu:
            current_section = "salary"
        elif "MARKET DEMAND" in lu:
            insight.demand_level = _norm_level(ls.split(":")[-1].strip().strip("*[]"))
        elif "GROWTH OUTLOOK" in lu:
            insight.growth_outlook = _norm_outlook(ls.split(":")[-1].strip().strip("*[]"))
        elif "COMPETITION LEVEL" in lu:
            insight.competition_level = _norm_level(ls.split(":")[-1].strip().strip("*[]"))
        elif "EDUCATION REQUIREMENTS" in lu:
            current_section = "education"
        elif "TYPICAL ENTRY" in lu:
            insight.typical_entry_experience = ls.split(":")[-1].strip().strip("*[]")
        elif "EMERGING SKILLS" in lu:
            insight.emerging_skills = [s.strip() for s in ls.split(":")[-1].strip().strip("*[]").split(",")]
        elif "DECLINING SKILLS" in lu:
            insight.declining_skills = [s.strip() for s in ls.split(":")[-1].strip().strip("*[]").split(",")]
        elif current_section and ls.startswith("-"):
            content = ls.lstrip("-•").strip()
            if current_section == "hard":
                insight.hard_requirements.append(MarketRequirement(skill_or_qualification=content.split(":")[0].strip(), importance="Required"))
            elif current_section == "soft":
                insight.soft_requirements.append(MarketRequirement(skill_or_qualification=content.split(":")[0].strip(), importance="Preferred"))
            elif current_section == "salary":
                insight.salary_range = _parse_salary(content, insight.salary_range, country)
            elif current_section == "education":
                cl = content.lower()
                if "minimum" in cl:
                    insight.min_education = content.split(":")[-1].strip()
                elif "preferred" in cl:
                    insight.preferred_education = content.split(":")[-1].strip()
                elif "certification" in cl:
                    insight.relevant_certifications = [c.strip() for c in content.split(":")[-1].strip().split(",")]
    return insight


def _parse_salary(line: str, current: Optional[SalaryRange], country: str) -> SalaryRange:
    if current is None:
        current = SalaryRange(currency=_currency(country))
    numbers = [float(n) for n in re.findall(r"[\d,]+", line.replace(",", "")) if n]
    ll = line.lower()
    if len(numbers) >= 2:
        lo, hi = numbers[0], numbers[1]
        if "entry" in ll:
            current.entry_level_min, current.entry_level_max = lo, hi
        elif "mid" in ll:
            current.mid_level_min, current.mid_level_max = lo, hi
        elif "senior" in ll:
            current.senior_level_min, current.senior_level_max = lo, hi
    return current


def _norm_level(s: str) -> str:
    l = s.lower()
    if "very high" in l or "intense" in l:
        return "Very High"
    if "high" in l:
        return "High"
    if "low" in l:
        return "Low"
    return "Medium"


def _norm_outlook(s: str) -> str:
    l = s.lower()
    if "boom" in l:
        return "Booming"
    if "grow" in l:
        return "Growing"
    if "declin" in l:
        return "Declining"
    return "Stable"


_CURRENCY_MAP = {"united states": "USD", "usa": "USD", "india": "INR", "united kingdom": "GBP", "uk": "GBP", "canada": "CAD", "australia": "AUD", "germany": "EUR", "france": "EUR", "japan": "JPY", "china": "CNY", "singapore": "SGD"}
_REGIONAL_MOD = {"united states": 1.0, "usa": 1.0, "switzerland": 1.3, "singapore": 0.9, "united kingdom": 0.85, "uk": 0.85, "germany": 0.75, "canada": 0.8, "australia": 0.85, "india": 0.25, "china": 0.4}


def _currency(country: str) -> str:
    return _CURRENCY_MAP.get(country.lower(), "USD")


def _regional_mod(country: str) -> float:
    return _REGIONAL_MOD.get(country.lower(), 0.7)


def _default_insight(role: str, field: str, country: str) -> JobMarketInsight:
    mod = _regional_mod(country)
    return JobMarketInsight(
        role_title=role, field=field,
        hard_requirements=[MarketRequirement(skill_or_qualification="Bachelor's Degree", importance="Required", description="In related field")],
        soft_requirements=[MarketRequirement(skill_or_qualification="Portfolio/Projects", importance="Preferred")],
        salary_range=SalaryRange(
            currency=_currency(country),
            entry_level_min=50000 * mod, entry_level_max=80000 * mod,
            mid_level_min=80000 * mod, mid_level_max=120000 * mod,
            senior_level_min=120000 * mod, senior_level_max=180000 * mod,
        ),
        demand_level="Medium", growth_outlook="Stable", competition_level="Medium",
        min_education="Bachelor's", preferred_education="Master's",
        typical_entry_experience="0-2 years",
    )
