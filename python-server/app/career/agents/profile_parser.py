"""
Node A: ProfileParser Agent
The Context Builder – reads raw profile data and creates a semantic summary.
"""

import re
import time
from datetime import datetime
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from ..models.state import CareerSimulationState
from ..models.career_profile import NormalizedProfile
from .base import (
    get_llm,
    normalize_gpa,
    infer_skills_from_major,
    calculate_age,
)


PROFILE_PARSER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert career counselor and profile analyst. Your task is to analyze a student's career profile and create a comprehensive summary that captures:
1. Their academic standing and potential
2. Their skill profile (both stated and implied)
3. Their career readiness level
4. Their unique characteristics and persona type
Be insightful but objective. Identify both strengths and areas for development."""),
    ("human", """Analyze this career profile and provide a detailed summary:

**Demographics:**
- Age: {age}
- Location: {location}
- Languages: {languages}

**Academic Background:**
- Education Level: {education_level}
- Institution: {institution}
- Major: {major}
- GPA: {gpa} (Normalized: {normalized_gpa}/100)
- Expected Graduation: {graduation_year}
- High School Stream: {hs_stream}
- Strong Subjects: {strong_subjects}

**Career Goals:**
- Target Fields: {target_fields}
- Specific Roles: {target_roles}
- Primary Goal: {career_goal}
- Desired Level: {desired_level}
- Work Environment Preference: {work_env}
- Relocation Willingness: {relocate}

**Skills:**
- Technical Skills (Self-Assessed): {tech_skills}
- Inferred Technical Skills (from major): {inferred_skills}
- Soft Skills: {soft_skills}

**Psychometrics:**
- Work Preference: {work_preference}
- Work Style: {work_style}
- Role Preference: {role_preference}
- Risk Tolerance: {risk_tolerance}
- Learning Style: {learning_style}

**Constraints:**
- Investment Capacity: {investment}
- Hours/Week Available: {hours_week}
- Timeline: {timeline}
- Has Mentor: {has_mentor}
- Institution Guidance Quality: {guidance_quality}/5

**Context:**
- Market Awareness: {market_awareness}
- Key Concerns: {concerns}
- Optimism Level: {optimism}

**Resume (if provided):**
{resume_text}

If a resume is provided, use it to:
- Validate and enrich the self-reported skills
- Identify additional experiences, projects, certifications, or achievements
- Better assess career readiness and competitive advantages
- Identify any gaps between stated goals and demonstrated experience

Provide your analysis in the following format:

**PERSONA CLASSIFICATION:** [One of: "High-Potential Low-Resource", "Career Switcher", "Fast-Track Ambitious", "Steady Climber", "Career Explorer", or a custom classification]

**PERSONA TRAITS:** [List 3-5 key traits]

**PROFILE SUMMARY:** [2-3 paragraph narrative summary suitable for use by other AI agents]

**CAREER READINESS SCORE:** [0-100, with brief justification]

**SKILL READINESS SCORE:** [0-100, with brief justification]

**FINANCIAL READINESS SCORE:** [0-100, with brief justification]

**KEY STRENGTHS:** [Bullet list]

**DEVELOPMENT AREAS:** [Bullet list]

**NOTABLE OBSERVATIONS:** [Any important insights or potential red flags]""")
])


def profile_parser_node(state: CareerSimulationState) -> dict:
    """Node A: Parse the raw career profile and create a normalized, enriched profile."""
    start_time = time.time()
    profile = state["career_profile"]

    # Normalize GPA
    normalized_gpa = 0.0
    if profile.current_gpa and profile.grading_scale:
        normalized_gpa = normalize_gpa(profile.current_gpa, profile.grading_scale)
    elif profile.current_gpa:
        normalized_gpa = normalize_gpa(profile.current_gpa, "4.0")

    # Infer skills
    inferred_skills = infer_skills_from_major(profile.current_major or "")
    combined_skills = dict(profile.technical_skills or {})
    for skill in inferred_skills:
        if skill not in combined_skills:
            combined_skills[skill] = "Basic"

    current_age = calculate_age(profile.date_of_birth)

    years_to_graduation = None
    if profile.expected_graduation_year:
        years_to_graduation = profile.expected_graduation_year - datetime.now().year
        if years_to_graduation < 0:
            years_to_graduation = 0

    location = (
        f"{profile.current_city}, {profile.current_country}"
        if profile.current_city
        else profile.current_country or "Not specified"
    )
    languages = "Not specified"
    if profile.languages_spoken:
        languages = ", ".join(
            [f"{l.language} ({l.proficiency})" for l in profile.languages_spoken]
        )

    llm = get_llm(temperature=0.3)
    chain = PROFILE_PARSER_PROMPT | llm | StrOutputParser()

    analysis = chain.invoke({
        "age": current_age or "Not specified",
        "location": location,
        "languages": languages,
        "education_level": profile.current_education_level or "Not specified",
        "institution": profile.institution_name or "Not specified",
        "major": profile.current_major or "Not specified",
        "gpa": profile.current_gpa or "Not specified",
        "normalized_gpa": round(normalized_gpa, 1),
        "graduation_year": profile.expected_graduation_year or "Not specified",
        "hs_stream": profile.high_school_stream or "Not specified",
        "strong_subjects": ", ".join(profile.key_subjects_strength) if profile.key_subjects_strength else "Not specified",
        "target_fields": ", ".join(profile.target_career_fields) if profile.target_career_fields else "Not specified",
        "target_roles": ", ".join(profile.specific_roles) if profile.specific_roles else "Not specified",
        "career_goal": profile.primary_career_goal or "Not specified",
        "desired_level": profile.desired_role_level or "Not specified",
        "work_env": ", ".join(profile.preferred_work_env) if profile.preferred_work_env else "Not specified",
        "relocate": profile.willingness_to_relocate or "Not specified",
        "tech_skills": str(profile.technical_skills) if profile.technical_skills else "None specified",
        "inferred_skills": ", ".join(inferred_skills) if inferred_skills else "None inferred",
        "soft_skills": str(profile.soft_skills) if profile.soft_skills else "None specified",
        "work_preference": profile.work_preference or "Not specified",
        "work_style": profile.work_style or "Not specified",
        "role_preference": profile.role_preference or "Not specified",
        "risk_tolerance": profile.risk_tolerance or "Medium",
        "learning_style": ", ".join(profile.learning_style) if profile.learning_style else "Not specified",
        "investment": profile.investment_capacity or "Not specified",
        "hours_week": profile.hours_per_week or "Not specified",
        "timeline": profile.desired_workforce_timeline or "Not specified",
        "has_mentor": "Yes" if profile.has_mentor else "No",
        "guidance_quality": profile.institution_guidance_quality or "Not rated",
        "market_awareness": profile.market_awareness or "Medium",
        "concerns": ", ".join(profile.career_concerns) if profile.career_concerns else "None specified",
        "optimism": profile.optimism_level or "Balanced",
        "resume_text": profile.resume_text or "No resume provided",
    })

    persona_type, persona_traits = _parse_persona(analysis)
    career_score, skill_score, financial_score = _parse_scores(analysis)
    profile_summary = _extract_summary(analysis)
    academic_strength = _calculate_academic_strength(
        normalized_gpa, profile.standardized_test_scores, profile.institution_name
    )

    normalized_profile = NormalizedProfile(
        raw_profile=profile,
        normalized_gpa=normalized_gpa,
        academic_strength_score=academic_strength,
        inferred_technical_skills={s: "Basic" for s in inferred_skills},
        combined_technical_skills=combined_skills,
        persona_type=persona_type,
        persona_traits=persona_traits,
        career_readiness_score=career_score,
        financial_readiness_score=financial_score,
        skill_readiness_score=skill_score,
        current_age=current_age,
        years_to_graduation=years_to_graduation,
        profile_summary=profile_summary,
    )

    processing_time = (time.time() - start_time) * 1000
    return {
        "normalized_profile": normalized_profile,
        "current_node": "profile_parser",
        "processing_time_ms": {"profile_parser": processing_time},
    }


# ── Helpers ────────────────────────────────────────────────────────────────────

def _parse_persona(analysis: str) -> tuple[str, list[str]]:
    persona_type = "Career Explorer"
    persona_traits: list[str] = []
    for line in analysis.split("\n"):
        if "PERSONA CLASSIFICATION:" in line.upper():
            parts = line.split(":", 1)
            if len(parts) > 1:
                persona_type = parts[1].strip().strip("[]\"'")
        if "PERSONA TRAITS:" in line.upper():
            parts = line.split(":", 1)
            if len(parts) > 1:
                persona_traits = [t.strip().strip("-•") for t in parts[1].strip().strip("[]").split(",")]
    return persona_type, persona_traits


def _parse_scores(analysis: str) -> tuple[float, float, float]:
    career_score = skill_score = financial_score = 50.0
    for line in analysis.split("\n"):
        lu = line.upper()
        if "CAREER READINESS SCORE:" in lu:
            career_score = _extract_score(line)
        elif "SKILL READINESS SCORE:" in lu:
            skill_score = _extract_score(line)
        elif "FINANCIAL READINESS SCORE:" in lu:
            financial_score = _extract_score(line)
    return career_score, skill_score, financial_score


def _extract_score(line: str) -> float:
    numbers = re.findall(r"\d+(?:\.\d+)?", line)
    for num in numbers:
        score = float(num)
        if 0 <= score <= 100:
            return score
    return 50.0


def _extract_summary(analysis: str) -> str:
    lines = analysis.split("\n")
    summary_lines: list[str] = []
    in_summary = False
    for line in lines:
        if "PROFILE SUMMARY:" in line.upper():
            in_summary = True
            parts = line.split(":", 1)
            if len(parts) > 1 and parts[1].strip():
                summary_lines.append(parts[1].strip())
            continue
        if in_summary:
            if any(h in line.upper() for h in [
                "CAREER READINESS", "SKILL READINESS", "FINANCIAL READINESS",
                "KEY STRENGTHS", "DEVELOPMENT AREAS", "NOTABLE OBSERVATIONS",
            ]):
                break
            if line.strip():
                summary_lines.append(line.strip())
    return "\n".join(summary_lines) if summary_lines else analysis[:500]


def _calculate_academic_strength(
    normalized_gpa: float,
    test_scores: dict | None,
    institution: str | None,
) -> float:
    score = normalized_gpa * 0.6
    if test_scores:
        test_component = 0.0
        count = 0
        for test, value in test_scores.items():
            tl = test.lower()
            if "sat" in tl:
                test_component += (value / 1600) * 100; count += 1
            elif "gre" in tl:
                test_component += (value / 340) * 100; count += 1
            elif "gmat" in tl:
                test_component += (value / 800) * 100; count += 1
            elif "jee" in tl:
                test_component += (95 if value <= 1000 else 85 if value <= 5000 else 75 if value <= 10000 else 60)
                count += 1
        if count > 0:
            score += (test_component / count) * 0.2
    else:
        score += normalized_gpa * 0.2

    institution_score = 70
    if institution:
        il = institution.lower()
        if any(w in il for w in ["iit", "mit", "stanford", "harvard", "berkeley", "oxford", "cambridge"]):
            institution_score = 95
        elif any(w in il for w in ["nit", "bits", "university of", "institute of technology"]):
            institution_score = 80
    score += institution_score * 0.2
    return min(100, max(0, score))
