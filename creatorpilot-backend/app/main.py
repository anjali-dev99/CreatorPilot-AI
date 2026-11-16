from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.content_routes import router as content_router
from app.routes.thumbnail_route import router as thumbnail_router

app = FastAPI(
    title="CreatorPilot AI",
    description="Multilingual AI Content Creation Assistant",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register Routes
app.include_router(content_router)
app.include_router(thumbnail_router)


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