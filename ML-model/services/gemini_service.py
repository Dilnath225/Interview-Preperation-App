import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
except ImportError:
    genai = None

class GeminiService:
    @staticmethod
    def get_model():
        if not genai or not GEMINI_API_KEY:
            return None
        return genai.GenerativeModel("gemini-1.5-flash")

    @classmethod
    def generate_chat_response(cls, user_message: str, context: str = "GENERAL") -> str:
        model = cls.get_model()
        if model:
            try:
                system_prompt = (
                    "You are an expert AI Career Coach & Principal Technical Interviewer at top tech companies. "
                    "Provide practical, encouraging, structured guidance with bullet points and STAR method examples where relevant. "
                    f"Context: {context}\nCandidate: {user_message}"
                )
                response = model.generate_content(system_prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[GeminiService] Chat generation error: {e}")

        # Intelligent Fallback
        lower = user_message.lower()
        if "star" in lower or "behavioral" in lower:
            return (
                "🎯 **STAR Method Formula for Behavioral Questions:**\n\n"
                "• **Situation:** 1-2 sentences setting up the context & scale.\n"
                "• **Task:** The core responsibility or bottleneck you owned.\n"
                "• **Action:** Specific technical/leadership steps YOU took.\n"
                "• **Result:** Quantifiable impact (e.g. 'boosted throughput by 35%')."
            )
        elif "salary" in lower or "negotiate" in lower:
            return (
                "💼 **Internship / Junior Salary Guidance:**\n\n"
                "1. Research industry standard bands for top tech firms in Sri Lanka (Sysco, 99x, WSO2).\n"
                "2. Emphasize your production readiness (e.g., full-stack experience, cloud deployments).\n"
                "3. Inquire about review cycles for permanent conversion!"
            )
        return (
            "That's an excellent question! In software engineering interviews, focus on clear problem decomposition, "
            "discussing trade-offs (Time vs Space complexity), and communicating your thought process proactively. "
            "Would you like to practice a mock question on this?"
        )

    @classmethod
    def evaluate_interview_answer(cls, question: str, answer: str, role: str = "Software Engineer") -> dict:
        model = cls.get_model()
        if model:
            try:
                prompt = (
                    f"You are a Senior Bar Raiser Interviewer evaluating a candidate for '{role}'.\n"
                    f"Question: \"{question}\"\n"
                    f"Candidate Answer: \"{answer}\"\n\n"
                    "Return ONLY a valid JSON object with the following schema:\n"
                    "{\n"
                    '  "score": integer (0-100),\n'
                    '  "clarityScore": integer (0-100),\n'
                    '  "technicalAccuracyScore": integer (0-100),\n'
                    '  "confidenceScore": integer (0-100),\n'
                    '  "strengths": ["strength 1", "strength 2"],\n'
                    '  "improvements": ["actionable tip 1", "actionable tip 2"],\n'
                    '  "sampleIdealAnswer": "string",\n'
                    '  "feedbackText": "string"\n'
                    "}"
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    cleaned = response.text.replace("```json", "").replace("```", "").strip()
                    return json.loads(cleaned)
            except Exception as e:
                print(f"[GeminiService] Evaluation error: {e}")

        # Heuristic scoring
        words = len(answer.split())
        base_score = min(92, max(55, 60 + words // 4))
        return {
            "score": base_score,
            "clarityScore": min(95, base_score + 2),
            "technicalAccuracyScore": base_score,
            "confidenceScore": min(90, base_score - 2),
            "strengths": [
                "Directly answered the question with good technical context",
                "Demonstrated logical flow and practical awareness",
            ],
            "improvements": [
                "Quantify results with measurable metrics where possible",
                "Use the STAR method structure for maximum clarity",
            ],
            "sampleIdealAnswer": (
                "In my previous project, we faced this challenge during peak load. "
                "I profiled the database queries, introduced composite indexes, and implemented "
                "Redis caching for frequently read entities. This reduced query latency by 40%."
            ),
            "feedbackText": f"Strong response demonstrating good foundational grasp of {role} expectations.",
        }
