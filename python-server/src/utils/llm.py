"""LLM service — wraps Google Gemini for structured and free-form generation."""

from typing import Type, TypeVar, Optional
import json
import re
import logging
import google.generativeai as genai
from pydantic import BaseModel
from src.config.settings import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Configure once at import time
genai.configure(api_key=settings.google_api_key)


def _extract_json(text: str) -> str:
    """Robustly extract JSON from LLM output that may contain markdown fences or extra text."""
    text = text.strip()

    # Try stripping ```json ... ``` or ``` ... ``` fences (greedy, handles multiline)
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()

    # Try to find a raw JSON object or array
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1]

    return text


class LLMService:
    """Thin wrapper around Google Gemini for structured + free-text generation."""

    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        self.model = genai.GenerativeModel(model_name)

    async def generate_structured(
        self,
        prompt: str,
        output_schema: Type[T],
        system_prompt: str = "",
    ) -> T:
        """Generate a response that conforms to a Pydantic schema."""
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        full_prompt = (
            f"{system_prompt}\n\n"
            f"You MUST respond ONLY with valid JSON matching this schema (no extra text, no markdown fences):\n{schema_json}\n\n"
            f"{prompt}"
        )
        response = await self.model.generate_content_async(full_prompt)
        text = response.text.strip()
        logger.debug("LLM raw response (first 500 chars): %s", text[:500])

        text = _extract_json(text)

        data = json.loads(text)
        return output_schema.model_validate(data)

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
    ) -> str:
        """Generate free-form text."""
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        response = await self.model.generate_content_async(full_prompt)
        return response.text.strip()


class GroqLLMService:
    """LLM wrapper using Groq API for fast inference."""

    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        self.model = model
        self.api_key = settings.groq_api_key

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
    ) -> str:
        import httpx

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": self.model, "messages": messages, "temperature": 0.7},
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def generate_structured(
        self,
        prompt: str,
        output_schema: Type[T],
        system_prompt: str = "",
    ) -> T:
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        full_prompt = (
            f"You MUST respond ONLY with valid JSON matching this schema (no extra text, no markdown fences):\n{schema_json}\n\n{prompt}"
        )
        text = await self.generate(full_prompt, system_prompt)
        logger.debug("Groq raw response (first 500 chars): %s", text[:500])

        text = _extract_json(text)

        data = json.loads(text)
        return output_schema.model_validate(data)


# ── Singletons ───────────────────────────────────────────────────────────────

_default_llm: Optional[LLMService] = None
_groq_llm: Optional[GroqLLMService] = None


def get_llm_service(provider: str = "gemini", model: str | None = None) -> LLMService | GroqLLMService:
    global _default_llm, _groq_llm

    if provider == "groq":
        if _groq_llm is None:
            _groq_llm = GroqLLMService(model=model or "llama-3.3-70b-versatile")
        return _groq_llm

    if _default_llm is None:
        _default_llm = LLMService(model_name=model or "gemini-3-flash-preview")
    return _default_llm
