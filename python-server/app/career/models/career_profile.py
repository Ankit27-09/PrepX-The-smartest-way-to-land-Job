"""
Career Profile Schema
Pydantic models for user career profile data collected from frontend.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LanguageProficiency(BaseModel):
    language: str
    proficiency: str  # Native, Fluent, Intermediate, Basic


class CareerProfile(BaseModel):
    """Complete user career profile collected from the multi-step form."""

    id: Optional[str] = None
    user_id: Optional[str] = None

    # Demographics
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    current_country: Optional[str] = None
    current_city: Optional[str] = None
    nationality: Optional[str] = None
    languages_spoken: Optional[list[LanguageProficiency]] = None

    # Academic Status
    current_education_level: Optional[str] = None
    institution_name: Optional[str] = None
    current_major: Optional[str] = None
    current_gpa: Optional[float] = None
    grading_scale: Optional[str] = None
    expected_graduation_year: Optional[int] = None

    # Past Academic Background
    high_school_stream: Optional[str] = None
    key_subjects_strength: list[str] = Field(default_factory=list)
    key_subjects_interest: list[str] = Field(default_factory=list)
    standardized_test_scores: Optional[dict[str, float]] = None

    # Career Aspirations
    target_career_fields: list[str] = Field(default_factory=list)
    specific_roles: list[str] = Field(default_factory=list)
    known_job_title: Optional[str] = None
    known_company_industry: Optional[str] = None

    # Long-Term Vision
    primary_career_goal: Optional[str] = None
    desired_role_level: Optional[str] = None
    preferred_work_env: list[str] = Field(default_factory=list)
    willingness_to_relocate: Optional[str] = None

    # Skills
    technical_skills: Optional[dict[str, str]] = None
    soft_skills: Optional[dict[str, int]] = None

    # Interests
    subjects_of_interest: list[str] = Field(default_factory=list)
    hobbies_activities: list[str] = Field(default_factory=list)
    enjoyable_project_desc: Optional[str] = None

    # Psychometrics
    work_preference: Optional[str] = None
    work_style: Optional[str] = None
    role_preference: Optional[str] = None
    risk_tolerance: Optional[str] = None
    learning_style: list[str] = Field(default_factory=list)

    # Financial
    investment_capacity: Optional[str] = None
    financial_dependents: Optional[bool] = None
    financial_details: Optional[str] = None
    target_min_salary: Optional[float] = None

    # Time
    hours_per_week: Optional[int] = None
    preferred_learning_mode: list[str] = Field(default_factory=list)
    desired_workforce_timeline: Optional[str] = None

    # Support
    has_mentor: Optional[bool] = None
    institution_guidance_quality: Optional[int] = None

    # Market Awareness
    market_awareness: Optional[str] = None
    career_concerns: list[str] = Field(default_factory=list)

    # Resume
    resume_text: Optional[str] = None
    resume_filename: Optional[str] = None

    # Customization
    optimism_level: Optional[str] = None
    priority_weights: Optional[dict[str, float]] = None

    class Config:
        populate_by_name = True


class NormalizedProfile(BaseModel):
    """Enriched profile created by the ProfileParser agent."""

    raw_profile: CareerProfile
    normalized_gpa: float = 0.0
    academic_strength_score: float = 0.0
    inferred_technical_skills: dict[str, str] = Field(default_factory=dict)
    combined_technical_skills: dict[str, str] = Field(default_factory=dict)
    persona_type: str = ""
    persona_traits: list[str] = Field(default_factory=list)
    career_readiness_score: float = 0.0
    financial_readiness_score: float = 0.0
    skill_readiness_score: float = 0.0
    current_age: Optional[int] = None
    years_to_graduation: Optional[int] = None
    profile_summary: str = ""


class MarketRequirement(BaseModel):
    skill_or_qualification: str
    importance: str  # Required, Preferred, Nice-to-have
    description: Optional[str] = None


class SalaryRange(BaseModel):
    currency: str = "USD"
    entry_level_min: float = 0.0
    entry_level_max: float = 0.0
    mid_level_min: float = 0.0
    mid_level_max: float = 0.0
    senior_level_min: float = 0.0
    senior_level_max: float = 0.0
    location_factor: float = 1.0


class JobMarketInsight(BaseModel):
    role_title: str
    field: str
    hard_requirements: list[MarketRequirement] = Field(default_factory=list)
    soft_requirements: list[MarketRequirement] = Field(default_factory=list)
    salary_range: Optional[SalaryRange] = None
    demand_level: str = "Medium"
    growth_outlook: str = "Stable"
    competition_level: str = "Medium"
    min_education: str = ""
    preferred_education: str = ""
    relevant_certifications: list[str] = Field(default_factory=list)
    typical_entry_experience: str = ""
    emerging_skills: list[str] = Field(default_factory=list)
    declining_skills: list[str] = Field(default_factory=list)


class MarketInsights(BaseModel):
    target_roles: list[JobMarketInsight] = Field(default_factory=list)
    alternative_roles: list[JobMarketInsight] = Field(default_factory=list)
    target_country: str = ""
    regional_demand_modifier: float = 1.0
    industry_health: str = "Stable"
    top_hiring_companies: list[str] = Field(default_factory=list)
    data_timestamp: Optional[datetime] = None
    data_sources: list[str] = Field(default_factory=list)
