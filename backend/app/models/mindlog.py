from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class MindLogCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)
    entry_date: date


class MindLogUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1, max_length=20000)
    entry_date: Optional[date] = None