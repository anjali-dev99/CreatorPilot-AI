from fastapi import APIRouter, HTTPException
from app.schemas.content import ContentRequest
from app.schemas.response import ContentResponse
from app.services.groq_service import GroqService
import re

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
        groq = GroqService()

        result = groq.generate_content(
            content=request.content,
            language=request.language,
            tone=request.tone,
            platform=request.platform or "General"
        )

        print("GROQ RAW RESPONSE")
        print(result)
        title_match=re.search(
            r"TITLE:\s*(.*?)(?=\nCONTENT:|\Z)",
            result,
            re.IGNORECASE | re.DOTALL
        )

        title = title_match.group(1).strip() if title_match else ""

        content_match= re.search(
            r"CONTENT:\s*(.*?)(?=\nHASHTAGS:|\Z)",
            result,
            re.IGNORECASE | re.DOTALL

        )

        description = content_match.group(1).strip() if content_match else result
        # Extract hashtags from groq response
        hashtags = list(set(re.findall(r"#\w+", result)))

        return ContentResponse(
            success=True,
            message="Content generated successfully",
            title=title,
            generated_content=description,
            hashtags=hashtags
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )