from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    session_id: Optional[str] = None   # None ho to naya session ban jayega
    message: str = Field(min_length=1, max_length=4000)
    language: str = "auto"

    @field_validator("language")
    @classmethod
    def _lang(cls, v):
        return v if v in ("en", "hi", "hinglish") else "auto"