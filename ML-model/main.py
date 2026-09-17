from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import uvicorn

from services.gemini_service import GeminiService
from services.ats_service import ATSService

app = FastAPI(
    title="AI Mentor - Python ML/AI Microservice",
    description="Microservice for LLM Coaching, Speech/Answer Evaluation, and Resume ATS Scoring",
    version="1.0.0",
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

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    role: Optional[str] = "Software Engineer"

class ResumeTextRequest(BaseModel):
    text: str
    target_role: Optional[str] = "Software Engineer"

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Mentor Python ML Microservice",
        "endpoints": ["/health", "/api/ai/chat", "/api/ai/evaluate-answer", "/api/ai/ats-diagnostic", "/docs"]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ML-model"}

@app.post("/api/ai/chat")
def chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    reply = GeminiService.generate_chat_response(payload.message, payload.context)
    return {"success": True, "reply": reply}

@app.post("/api/ai/evaluate-answer")
def evaluate_answer(payload: EvaluateAnswerRequest):
    if not payload.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")
    
    result = GeminiService.evaluate_interview_answer(payload.question, payload.answer, payload.role)
    return {"success": True, "evaluation": result}

@app.post("/api/ai/ats-diagnostic")
def ats_diagnostic(payload: ResumeTextRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")
    
    result = ATSService.analyze_resume_text(payload.text, payload.target_role)
    return {"success": True, "diagnostic": result}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 Starting Python ML Microservice on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
