from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import uvicorn

from services.gemini_service import GeminiService
from services.ats_service import ATSService
from services.rag_service import RAGService

app = FastAPI(
    title="AI Mentor - Python ML/AI Microservice with RAG",
    description="Microservice for LLM Coaching with RAG, Speech/Answer Evaluation, and Resume ATS Scoring",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "GENERAL"
    history: Optional[str] = ""
    user_profile: Optional[Dict] = None


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    role: Optional[str] = "Software Engineer"


class ResumeTextRequest(BaseModel):
    text: str
    target_role: Optional[str] = "Software Engineer"


class RAGSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    filter_topic: Optional[str] = None


# Startup Event — Initialize RAG
@app.on_event("startup")
async def startup_event():
    """Initialize the RAG service on startup — load knowledge base into ChromaDB."""
    print("🔄 Initializing RAG service...")
    success = RAGService.initialize()
    if success:
        status = RAGService.get_status()
        print(f"✅ RAG service ready! {status['document_count']} document chunks loaded.")
    else:
        print("⚠️ RAG service initialization failed. Chatbot will use fallback responses.")


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Mentor Python ML Microservice (with RAG)",
        "version": "2.0.0",
        "endpoints": [
            "/health",
            "/api/ai/chat",
            "/api/ai/evaluate-answer",
            "/api/ai/ats-diagnostic",
            "/api/ai/rag/status",
            "/api/ai/rag/search",
            "/docs",
        ],
    }


@app.get("/health")
def health():
    rag_status = RAGService.get_status()
    return {
        "status": "healthy",
        "service": "ML-model",
        "rag_initialized": rag_status["initialized"],
        "rag_document_count": rag_status["document_count"],
    }


@app.post("/api/ai/chat")
def chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    reply = GeminiService.generate_chat_response(
        payload.message,
        payload.context or "GENERAL",
        history=payload.history or "",
        user_profile=payload.user_profile,
    )
    return {"success": True, "reply": reply}


@app.post("/api/ai/evaluate-answer")
def evaluate_answer(payload: EvaluateAnswerRequest):
    if not payload.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    result = GeminiService.evaluate_interview_answer(
        payload.question, payload.answer, payload.role
    )
    return {"success": True, "evaluation": result}


@app.post("/api/ai/ats-diagnostic")
def ats_diagnostic(payload: ResumeTextRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")

    result = ATSService.analyze_resume_text(payload.text, payload.target_role)
    return {"success": True, "diagnostic": result}


# --- RAG-specific endpoints ---

@app.get("/api/ai/rag/status")
def rag_status():
    """Get the current status of the RAG service."""
    status = RAGService.get_status()
    return {"success": True, "rag": status}


@app.post("/api/ai/rag/search")
def rag_search(payload: RAGSearchRequest):
    """
    Debug endpoint: Perform semantic search on the knowledge base.
    Useful for testing that RAG retrieval is working correctly.
    """
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    results = RAGService.retrieve(
        payload.query,
        top_k=payload.top_k or 5,
        filter_topic=payload.filter_topic,
    )
    return {
        "success": True,
        "query": payload.query,
        "result_count": len(results),
        "results": results,
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 Starting Python ML Microservice (with RAG) on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
