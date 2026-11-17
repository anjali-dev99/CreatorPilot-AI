from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.groq_service import GroqService

router = APIRouter(
    prefix="/api/thumbnail",
    tags=["Thumbnail Generation"]
)


class ThumbnailRequest(BaseModel):
    content: str
    platform: str = "YouTube"
    language: str = "English"


@router.post("/generate")
def generate_thumbnail(request: ThumbnailRequest):

    if not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Content cannot be empty"
        )

    try:
        groq = GroqService()

        result = groq.generate_thumbnail_ideas(
            content=request.content,
            platform=request.platform,
            language=request.language
        )

        return {
            "success": True,
            "message": "Thumbnail ideas generated successfully",
            "data": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Thumbnail generation failed: {str(e)}"
        )