from fastapi import FastAPI
from app.routes.content_routes import router as content_router

app = FastAPI(
    title="CreatorPilot AI",
    description="Multilingual AI Content Creation Assistant",
    version="1.0.0"
)

app.include_router(content_router)


@app.get("/")
def home():
    return {
        "message": "CreatorPilot AI Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }