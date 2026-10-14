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

# Import RAG service
from services.rag_service import RAGService


class GeminiService:
    @staticmethod
    def get_model():
        if not genai or not GEMINI_API_KEY:
            return None
        return genai.GenerativeModel("gemini-3.5-flash")

    @classmethod
    def generate_chat_response(cls, user_message: str, context: str = "GENERAL",
                                history: str = "", user_profile: dict = None) -> str:
        """
        Generate a chat response using RAG-augmented Gemini LLM.
        
        1. Retrieve relevant knowledge base context via RAG
        2. Build augmented prompt with retrieved context
        3. Generate response with Gemini (or intelligent fallback)
        """
        # Step 1: Retrieve relevant context from knowledge base
        rag_context = RAGService.augment_prompt(user_message, context=context, top_k=5)

        # Build user profile context
        profile_info = ""
        if user_profile:
            role = user_profile.get("targetRole", "Software Engineer")
            skills = user_profile.get("skills", "")
            profile_info = f"\nCandidate Profile: Targeting '{role}' roles. Skills: {skills}."

        # Build conversation history context
        history_block = ""
        if history:
            history_block = f"\n\nRecent Conversation History:\n{history}"

        # Step 2: Try Gemini LLM with RAG-augmented prompt
        model = cls.get_model()
        if model:
            try:
                system_prompt = (
                    "You are \"AI Mentor\", an elite Principal Technical Interviewer and Career Coach "
                    "specializing in software engineering interviews, internships, and career development.\n\n"
                    "You have access to a curated knowledge base about interview preparation, technical topics, "
                    "coding patterns, resume optimization, and the Sri Lankan tech industry.\n\n"
                    "IMPORTANT INSTRUCTIONS:\n"
                    "- Use the knowledge base context below to provide accurate, specific, and actionable advice.\n"
                    "- If the knowledge base contains relevant information, USE IT in your response.\n"
                    "- Provide structured responses with markdown formatting, bullet points, and code examples where relevant.\n"
                    "- Be encouraging but honest about areas for improvement.\n"
                    "- Use the STAR method framework when discussing behavioral interview answers.\n"
                    "- Include specific metrics and examples wherever possible.\n"
                )

                if rag_context:
                    system_prompt += f"\n--- RETRIEVED KNOWLEDGE BASE CONTEXT ---\n{rag_context}\n--- END CONTEXT ---\n"

                if profile_info:
                    system_prompt += profile_info

                if history_block:
                    system_prompt += history_block

                system_prompt += f"\n\nCandidate's Question: {user_message}\n\nAI Mentor Response:"

                response = model.generate_content(system_prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[GeminiService] Chat generation error: {e}")

        # Step 3: Intelligent RAG-powered fallback (no LLM API needed)
        if rag_context:
            return cls._generate_rag_fallback(user_message, rag_context, context)

        # Step 4: Static fallback (legacy behavior)
        return cls._generate_static_fallback(user_message)

    @classmethod
    def _generate_rag_fallback(cls, user_message: str, rag_context: str, context: str) -> str:
        """
        Generate a structured response using RAG-retrieved context WITHOUT an LLM.
        This provides domain-specific responses even when Gemini API is not available.
        """
        lower = user_message.lower()

        # Extract the most relevant chunk from RAG context
        context_lines = rag_context.split("\n")
        relevant_content = []
        for line in context_lines:
            line = line.strip()
            if line and not line.startswith("---") and not line.startswith("(relevance"):
                relevant_content.append(line)

        # Build a structured response from retrieved knowledge
        if relevant_content:
            # Take first ~15 most relevant lines to keep response concise
            content_preview = "\n".join(relevant_content[:15])

            response = (
                f"🎯 **AI Mentor — Knowledge Base Response**\n\n"
                f"Based on our interview preparation knowledge base, here's relevant guidance:\n\n"
                f"{content_preview}\n\n"
                f"---\n"
                f"💡 *This response was generated from our curated knowledge base. "
                f"For more personalized AI-powered coaching, configure your Gemini API key.*"
            )
            return response

        return cls._generate_static_fallback(user_message)

    @classmethod
    def _generate_static_fallback(cls, user_message: str) -> str:
        """Legacy static fallback responses when neither LLM nor RAG context is available."""
        lower = user_message.lower()
        
        # Behavioral & Strategy
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
        elif "resume" in lower or "cv" in lower or "ats" in lower:
            return (
                "📄 **Resume & ATS Optimization Tips:**\n\n"
                "1. Use the XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.\n"
                "2. Include a categorized Technical Skills section.\n"
                "3. Use strong action verbs: Architected, Engineered, Optimized.\n"
                "4. Keep to 1 page for <3 years experience.\n"
                "5. Submit as PDF with naming format: FirstName_LastName_Resume.pdf"
            )
        elif "system design" in lower or "scale" in lower or "architecture" in lower:
            return (
                "⚡ **System Design Interview Blueprint:**\n\n"
                "1. **Clarify Constraints:** RPS/QPS, read/write ratio, latency SLA.\n"
                "2. **High-Level Design:** API Gateway → Load Balancer → Microservices → Cache → DB.\n"
                "3. **Deep Dive:** Message queues (Kafka), DB indexing, horizontal scaling.\n"
                "4. **Trade-offs:** CAP theorem, consistency vs availability."
            )
        elif "coding" in lower or "leetcode" in lower or "algorithm" in lower or "dsa" in lower:
            return (
                "💻 **Coding Interview Preparation:**\n\n"
                "1. Master these 5 patterns: Two Pointers, Sliding Window, BFS/DFS, Binary Search, Dynamic Programming.\n"
                "2. Practice 2-3 problems daily on LeetCode (start with Easy, progress to Medium).\n"
                "3. Always discuss brute force first, then optimize.\n"
                "4. Think aloud — interviewers evaluate your problem-solving process."
            )
            
        # JS Frameworks
        elif "react" in lower or "nextjs" in lower:
            return (
                "⚛️ **React & Next.js Knowledge:**\n\n"
                "- **Virtual DOM:** React batches UI updates using the V-DOM.\n"
                "- **Hooks:** Use `useState` for state, `useEffect` for side-effects, `useMemo` for optimization.\n"
                "- **Next.js:** Focus on SSR vs SSG for performance and SEO."
            )
        elif "angular" in lower:
            return (
                "🛡️ **Angular Knowledge:**\n\n"
                "- **Architecture:** Modules, Components, Services, and Dependency Injection.\n"
                "- **RxJS:** Observables and operators (`map`, `switchMap`).\n"
                "- **Change Detection:** Zone.js, Default vs OnPush."
            )
        elif "vue" in lower:
            return (
                "🟢 **Vue.js Knowledge:**\n\n"
                "- **Reactivity:** Proxies (Vue 3) / Object.defineProperty (Vue 2).\n"
                "- **Composition API:** `setup()`, `ref`, and `reactive`.\n"
                "- **Directives:** `v-model`, `v-if`, `v-for`."
            )
            
        # Backend & Languages
        elif "node" in lower or "express" in lower:
            return (
                "🟩 **Node.js & Express:**\n\n"
                "- **Event Loop:** Single-threaded async I/O model (timers, poll, check).\n"
                "- **Express:** Middleware and routing.\n"
                "- **Performance:** Use worker threads for CPU tasks, streams for heavy data."
            )
        elif "python" in lower or "django" in lower or "fastapi" in lower:
            return (
                "🐍 **Python & Frameworks:**\n\n"
                "- **Core:** GIL, decorators, generators.\n"
                "- **FastAPI:** Async IO, Pydantic validation, dependency injection.\n"
                "- **Django:** ORM, MVC (MVT) architecture."
            )
        elif "java " in lower or "spring" in lower:
            return (
                "☕ **Java & Spring Boot:**\n\n"
                "- **OOP:** Encapsulation, Inheritance, Polymorphism.\n"
                "- **JVM:** Garbage Collection, Heap vs Stack.\n"
                "- **Spring:** Dependency Injection (IoC), MVC, Data JPA."
            )
        elif "javascript" in lower or "js" in lower:
            return (
                "📜 **JavaScript Fundamentals:**\n\n"
                "- **Closures:** Functions remembering their lexical scope.\n"
                "- **Promises:** Handling async operations (Async/Await).\n"
                "- **Event Delegation:** Attaching one listener to a parent element."
            )
            
        # Databases & APIs
        elif "sql" in lower or "database" in lower or "mongodb" in lower:
            return (
                "🗄️ **Databases:**\n\n"
                "- **SQL:** ACID, Normalization, Joins, B-Tree Indexes.\n"
                "- **NoSQL (MongoDB):** Schema-less, eventual consistency, horizontal sharding."
            )
        elif "api" in lower or "rest" in lower or "graphql" in lower:
            return (
                "🌐 **APIs:**\n\n"
                "- **REST:** Stateless, standard HTTP methods.\n"
                "- **GraphQL:** Solves over/under-fetching, single endpoint.\n"
                "- **Security:** JWT authentication, CORS, rate limiting."
            )

        return (
            "🤖 **Offline AI Mentor:**\n\n"
            "I am currently operating in offline fallback mode. "
            "However, remember to clarify problems, discuss trade-offs, and think aloud in your interviews!\n\n"
            "Ask me specific questions about React, Angular, Node, Python, Java, SQL, or System Design!"
        )

    @classmethod
    def evaluate_interview_answer(cls, question: str, answer: str, role: str = "Software Engineer") -> dict:
        """Evaluate an interview answer using RAG-augmented context for better scoring criteria."""

        # Retrieve evaluation-relevant context from knowledge base
        eval_query = f"How to evaluate interview answer for {role}: {question}"
        rag_context = RAGService.augment_prompt(eval_query, context="INTERVIEW_COACH", top_k=3)

        model = cls.get_model()
        if model:
            try:
                prompt = (
                    f"You are a Senior Bar Raiser Interviewer evaluating a candidate for '{role}'.\n"
                    f"Question: \"{question}\"\n"
                    f"Candidate Answer: \"{answer}\"\n\n"
                )

                if rag_context:
                    prompt += (
                        f"Use the following evaluation criteria from our knowledge base:\n"
                        f"{rag_context}\n\n"
                    )

                prompt += (
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
