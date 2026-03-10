"""Groq-based job description extraction service."""

import json
from groq import Groq
from src.config.settings import settings
from src.models.interview import JobDetails

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


EXTRACTION_PROMPT = """You are a job description parser. Extract structured job details from the following job description text.

Return a JSON object with EXACTLY these fields:
{
  "job_title": "string — the job title/position name",
  "company": "string — the company name (empty string if not found)",
  "location": "string — job location or 'Remote' (empty string if not found)",
  "employment_type": "string — one of: full-time, part-time, contract, internship, freelance",
  "experience_level": "string — one of: entry, mid, senior, lead, executive",
  "salary_range": "string — salary range if mentioned (empty string if not found)",
  "skills": ["array of strings — key technical and soft skills required"],
  "job_description": "string — a concise summary of the role and responsibilities",
  "requirements": "string — key qualifications and requirements"
}

Rules:
- Extract only information explicitly stated or strongly implied in the JD.
- For employment_type, default to "full-time" if not specified.
- For experience_level, infer from years of experience or seniority in title. Default to "mid".
- skills should contain specific, individual skills (e.g., "React", "Python"), not vague phrases.
- Return ONLY the JSON object, no markdown, no explanation.

Job Description:
---
{jd_text}
---"""


async def extract_job_details(jd_text: str) -> JobDetails:
    """Send JD text to Groq API and extract structured job details."""
    client = _get_client()
    prompt = EXTRACTION_PROMPT.replace("{jd_text}", jd_text)

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a precise JSON extractor. Return only valid JSON, no markdown formatting.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    response_text = chat_completion.choices[0].message.content.strip()

    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end > start:
            parsed = json.loads(response_text[start:end])
        else:
            raise ValueError(f"Failed to parse Groq response as JSON: {response_text[:200]}")

    return JobDetails(**parsed)
