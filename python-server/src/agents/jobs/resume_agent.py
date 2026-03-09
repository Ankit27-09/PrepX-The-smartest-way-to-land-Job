from typing import Optional
from pydantic import BaseModel, Field

from src.utils.llm import get_llm_service
from src.utils.pdf import get_document_ai_service
from src.models.jobs.schemas import ResumeParseResult
from src.prompts.jobs.resume_prompts import RESUME_SYSTEM_PROMPT, RESUME_USER_PROMPT


class ResumeAgent:
    MAX_RETRIES = 2

    def __init__(self):
        self.llm = get_llm_service()
        self.doc_service = get_document_ai_service()
    
    async def parse_resume_pdf(self, pdf_content: bytes) -> ResumeParseResult:
        raw_text = await self.doc_service.extract_text_from_pdf(pdf_content)
        
        if not raw_text or len(raw_text.strip()) < 50:
            return ResumeParseResult(
                skills=[],
                experience_years=0,
                domains=[],
                education=[],
                projects=[],
                raw_text=raw_text or ""
            )
        
        return await self.parse_resume_text(raw_text)
    
    async def parse_resume_text(self, resume_text: str) -> ResumeParseResult:
        prompt = RESUME_USER_PROMPT.format(resume_text=resume_text)
        
        last_error = None
        for attempt in range(self.MAX_RETRIES):
            try:
                result = await self.llm.generate_structured(
                    prompt=prompt,
                    output_schema=ResumeParseResult,
                    system_prompt=RESUME_SYSTEM_PROMPT
                )
                result.raw_text = resume_text

                # If we got a meaningful result, return it
                if result.skills:
                    return result

                # Empty skills — retry if we have attempts left
                last_error = None
            except Exception as e:
                last_error = e
        
        # All retries exhausted — return whatever we have or raise
        if last_error:
            raise last_error
        # result exists but skills empty — return it anyway
        result.raw_text = resume_text
        return result


_resume_agent: Optional[ResumeAgent] = None


def get_resume_agent() -> ResumeAgent:
    global _resume_agent
    if _resume_agent is None:
        _resume_agent = ResumeAgent()
    return _resume_agent
