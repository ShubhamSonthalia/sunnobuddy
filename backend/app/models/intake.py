from pydantic import BaseModel, field_validator


class AnswerRequest(BaseModel):
    answer: str

    @field_validator("answer")
    @classmethod
    def _clean(cls, v):
        v = v.strip()
        if not v or len(v) > 4000:
            raise ValueError("answer must be 1-4000 characters")
        return v