from pydantic import BaseModel, Field
from typing import List


class ContentResponse(BaseModel):
    success: bool
    message: str
    generated_content: str
    hashtags: List[str] = Field(default_factory=list)
