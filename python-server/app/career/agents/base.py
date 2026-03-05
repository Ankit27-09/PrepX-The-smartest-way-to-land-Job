"""
Base Agent Module
Shared utilities and base classes for all career simulation agents.
Adapted for PrepX: uses Google Gemini via langchain-google-genai.
"""

import os
from typing import Optional
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel


def get_llm(
    model_name: Optional[str] = None,
    temperature: float = 0.7,
) -> BaseChatModel:
    """
    Get a configured Gemini LLM instance.

    Args:
        model_name: Specific Gemini model (default: gemini-2.5-flash)
        temperature: Model temperature

    Returns:
        Configured ChatGoogleGenerativeAI instance
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY must be set")

    return ChatGoogleGenerativeAI(
        model=model_name or "gemini-2.5-flash",
        temperature=temperature,
        google_api_key=api_key,
    )


class AgentConfig:
    """Configuration for agents."""
    temperature: float = 0.7
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout_seconds: int = 60


# ── Major → Skills mapping ────────────────────────────────────────────────────

MAJOR_TO_SKILLS_MAP = {
    "computer science": ["Programming", "Data Structures", "Algorithms", "Software Development"],
    "cs": ["Programming", "Data Structures", "Algorithms", "Software Development"],
    "software engineering": ["Programming", "Software Development", "System Design", "Testing"],
    "information technology": ["Programming", "Networking", "Database Management", "System Administration"],
    "it": ["Programming", "Networking", "Database Management", "System Administration"],
    "data science": ["Python", "Statistics", "Machine Learning", "Data Analysis"],
    "artificial intelligence": ["Python", "Machine Learning", "Deep Learning", "Mathematics"],
    "ai": ["Python", "Machine Learning", "Deep Learning", "Mathematics"],
    "machine learning": ["Python", "Statistics", "Deep Learning", "Mathematics"],
    "cybersecurity": ["Networking", "Security Tools", "Linux", "Cryptography"],
    "electrical engineering": ["Circuit Design", "Electronics", "Signal Processing", "MATLAB"],
    "ee": ["Circuit Design", "Electronics", "Signal Processing", "MATLAB"],
    "mechanical engineering": ["CAD", "Thermodynamics", "Materials Science", "Manufacturing"],
    "me": ["CAD", "Thermodynamics", "Materials Science", "Manufacturing"],
    "civil engineering": ["AutoCAD", "Structural Analysis", "Project Management", "Surveying"],
    "chemical engineering": ["Process Design", "Chemistry", "MATLAB", "Process Control"],
    "business administration": ["Business Strategy", "Management", "Financial Analysis", "Marketing"],
    "mba": ["Business Strategy", "Leadership", "Financial Analysis", "Operations"],
    "finance": ["Financial Modeling", "Excel", "Accounting", "Investment Analysis"],
    "marketing": ["Digital Marketing", "Market Research", "Analytics", "Content Strategy"],
    "economics": ["Statistical Analysis", "Economic Modeling", "Data Analysis", "Research"],
    "physics": ["Mathematics", "Data Analysis", "Programming", "Research Methods"],
    "chemistry": ["Lab Techniques", "Data Analysis", "Research Methods", "Technical Writing"],
    "biology": ["Lab Techniques", "Data Analysis", "Research Methods", "Bioinformatics"],
    "mathematics": ["Mathematical Modeling", "Statistics", "Programming", "Problem Solving"],
    "medicine": ["Clinical Skills", "Patient Care", "Medical Knowledge", "Research"],
    "nursing": ["Patient Care", "Clinical Skills", "Healthcare Management", "Communication"],
    "pharmacy": ["Pharmaceutical Knowledge", "Patient Counseling", "Healthcare Regulations", "Chemistry"],
    "graphic design": ["Adobe Creative Suite", "UI Design", "Visual Communication", "Typography"],
    "ux design": ["User Research", "Wireframing", "Prototyping", "Usability Testing"],
    "ui design": ["Visual Design", "Prototyping", "Design Systems", "HTML/CSS"],
}

# Grading scale normalization
GRADING_SCALES = {
    "4.0": {"max": 4.0, "excellent": 3.7, "good": 3.0, "average": 2.5},
    "10.0": {"max": 10.0, "excellent": 9.0, "good": 7.5, "average": 6.0},
    "percentage": {"max": 100.0, "excellent": 85.0, "good": 70.0, "average": 55.0},
    "cgpa_10": {"max": 10.0, "excellent": 9.0, "good": 7.5, "average": 6.0},
    "gpa_4": {"max": 4.0, "excellent": 3.7, "good": 3.0, "average": 2.5},
}


def normalize_gpa(gpa: float, scale: str) -> float:
    """Normalize GPA to 0-100 scale."""
    scale_lower = scale.lower() if scale else "4.0"
    for scale_key, values in GRADING_SCALES.items():
        if scale_key in scale_lower or scale_lower in scale_key:
            return (gpa / values["max"]) * 100
    return (gpa / 4.0) * 100


def infer_skills_from_major(major: str) -> list[str]:
    """Infer likely technical skills from academic major."""
    if not major:
        return []
    major_lower = major.lower().strip()
    for key, skills in MAJOR_TO_SKILLS_MAP.items():
        if key in major_lower or major_lower in key:
            return skills
    return []


# Persona classification rules
PERSONA_RULES = {
    "high_potential_low_resource": {
        "conditions": ["high_academic", "low_budget"],
        "label": "High-Potential, Low-Resource Student",
        "traits": ["Academically strong", "Budget-conscious", "Scholarship candidate"],
    },
    "career_switcher": {
        "conditions": ["has_experience", "different_field"],
        "label": "Career Switcher",
        "traits": ["Transferable skills", "Industry experience", "Clear motivation"],
    },
    "fast_tracker": {
        "conditions": ["high_academic", "high_ambition", "high_risk_tolerance"],
        "label": "Fast-Track Ambitious",
        "traits": ["High achiever", "Risk-taker", "Growth-oriented"],
    },
    "steady_climber": {
        "conditions": ["moderate_academic", "low_risk_tolerance", "structured_preference"],
        "label": "Steady Climber",
        "traits": ["Methodical", "Risk-averse", "Stability-focused"],
    },
    "explorer": {
        "conditions": ["multiple_interests", "undecided_field"],
        "label": "Career Explorer",
        "traits": ["Curious", "Versatile", "Discovery-oriented"],
    },
}


def calculate_age(date_of_birth) -> Optional[int]:
    """Calculate age from date of birth."""
    if not date_of_birth:
        return None
    if isinstance(date_of_birth, str):
        try:
            date_of_birth = datetime.fromisoformat(date_of_birth.replace("Z", "+00:00"))
        except ValueError:
            return None
    today = datetime.now()
    age = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age
