from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class VoiceSessionRequest(BaseModel):
    language: str = "auto"


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=4000)


class TranscriptRequest(BaseModel):
    turns: List[Turn] = Field(min_length=1, max_length=50)