from pydantic import BaseModel, Field
from typing import Optional, Literal


class ContentRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        description="Text or transcript to process"
    )

    content_type: Literal["text", "audio", "video"] = "text"

    language: str = Field(
        default="English",
        description="Preferred output language"
    )

    platform: Optional[str] = Field(
        default=None,
        description="Target platform such as Instagram or YouTube"
    )

    tone: str = Field(
        default="engaging",
        description="Desired content tone"
    )