from fastapi import APIRouter, HTTPException
from app.schemas.content import ContentRequest
from app.schemas.response import ContentResponse
from app.services.gemini_service import GeminiService

router = APIRouter(
    prefix="/api/content",
    tags=["Content Generation"]
)


@router.post("/generate", response_model=ContentResponse)
def generate_content(request: ContentRequest):

    if request.content_type != "text":
        raise HTTPException(
            status_code=501,
            detail="Audio and video processing are planned for a later phase."
        )

    try:
        gemini = GeminiService()

        result = gemini.generate_content(
            content=request.content,
            language=request.language,
            tone=request.tone,
            platform=request.platform or "General"
        )

        return ContentResponse(
            success=True,
            message="Content generated successfully",
            generated_content=result,
            hashtags=[]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )