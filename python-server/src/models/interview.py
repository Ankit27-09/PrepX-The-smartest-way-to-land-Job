"""Pydantic models for the AI Interview feature."""

from pydantic import BaseModel, Field
from typing import Optional


class ManualJDRequest(BaseModel):
    jd_text: str = Field(..., min_length=10, description="Job description text")


class JobDetails(BaseModel):
    job_title: str = ""
    company: str = ""
    location: str = ""
    employment_type: str = "full-time"
    experience_level: str = "mid"
    salary_range: str = ""
    skills: list[str] = []
    job_description: str = ""
    requirements: str = ""


class JobDetailsResponse(BaseModel):
    interview_id: str
    jd_text: str
    job_details: JobDetails


class InterviewContext(BaseModel):
    difficulty_level: str = "medium"
    focus_areas: list[str] = []
    additional_context: str = ""
    resume_text: str = ""
    coding_platform: str = "leetcode"


class InterviewSettings(BaseModel):
    duration: str = "30"
    interview_mode: str = "3d-avatar"
    avatar_model: str = "michael"
    notify_email: bool = True
    notify_sms: bool = False
    language: str = "english"
    max_retakes: str = "1"


class UpdateInterviewRequest(BaseModel):
    job_details: Optional[JobDetails] = None
    interview_context: Optional[InterviewContext] = None
    interview_settings: Optional[InterviewSettings] = None


class InterviewResponse(BaseModel):
    interview_id: str
    message: str


class InterviewListItem(BaseModel):
    id: str
    job_title: str
    company: str
    status: str
    interview_mode: str
    avatar_model: str
    duration: str
    difficulty_level: str
    created_at: str
    updated_at: str


class ExecuteCodeRequest(BaseModel):
    language: str
    version: str
    code: str
    stdin: str = ""


class ExecuteCodeResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int


class ConnectionDetailsRequest(BaseModel):
    room_name: Optional[str] = None
    participant_identity: Optional[str] = None
    participant_name: Optional[str] = None
    participant_metadata: Optional[str] = None
    participant_attributes: Optional[dict[str, str]] = None
    room_config: Optional[dict] = None
    interview_id: Optional[str] = None


class RoomStatusResponse(BaseModel):
    interview_id: str
    status: str
    room_name: str | None = None
