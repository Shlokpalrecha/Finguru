"""FinGuru Backend API - Main Application"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import receipts, voice, ledger, advisor
from config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Preload Whisper model
    print("Starting FinGuru API...")
    try:
        from services.transcribe import preload_model
        preload_model()
    except Exception as e:
        print(f"Warning: Whisper model preload failed: {e}")
        print("Voice transcription will attempt to load model on first request.")
    
    yield
    
    # Shutdown
    print("Shutting down FinGuru API...")


app = FastAPI(
    title="FinGuru API",
    description="AI Financial Assistant for Indian MSMEs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(receipts.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(ledger.router, prefix="/api")
app.include_router(advisor.router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "FinGuru API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    # Check if OpenAI Whisper API is configured
    whisper_status = "not_configured"
    try:
        from services.transcribe import client
        if client is not None:
            whisper_status = "api_ready"
    except:
        pass
    
    return {
        "status": "healthy",
        "services": {
            "api": "up",
            "s3": "configured",
            "dynamodb": "configured",
            "textract": "configured",
            "whisper": whisper_status
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
