from fastapi import APIRouter, HTTPException
from app.schemas.content import ContentRequest
from app.services.gemini_service import generate_content

router = APIRouter(prefix="/text", tags=["Text Generation"])


@router.post("/generate")
def generate(request: ContentRequest):

    try:
        result = generate_content(
            text=request.text,
            language=request.language,
            tone=request.tone,
            content_type=request.content_type
        )

        return {
            "success": True,
            "input": request.text,
            "language": request.language,
            "content_type": request.content_type,
            "generated_content": result
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI generation failed. Check your API configuration."
        )