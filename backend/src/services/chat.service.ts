import axios from 'axios';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

export interface ChatAttachment {
  name: string;
  type: string;
  data: string;
}

export class ChatService {
  static async sendMessage(
    userId: string,
    userMessage: string,
    context = 'INTERVIEW_COACH',
    attachment?: ChatAttachment
  ) {
    // 1. Fetch recent conversation history to provide multi-turn context memory to the LLM
    const pastMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // 2. Save user message to database (record attachment name if attached)
    const storedMessage = attachment?.name
      ? `[📎 Attached: ${attachment.name}]\n${userMessage}`
      : userMessage;

    await prisma.chatMessage.create({
      data: {
        userId,
        sender: 'USER',
        message: storedMessage,
        context,
      },
    });

    // Build conversation history text for multi-turn context
    const historyText = pastMessages
      .reverse()
      .map((m) => `${m.sender === 'USER' ? 'Candidate' : 'AI Mentor'}: ${m.message}`)
      .join('\n');

    // Fetch user profile for personalized RAG retrieval
    let userProfile: { targetRole: string | null; skills: string | null } | null = null;
    try {
      userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: { targetRole: true, skills: true },
      });
    } catch (err) {
      console.warn('Could not fetch user profile for RAG context');
    }

    let aiReply = '';

    // A. Priority 1: Direct Google Gemini API Call (multimodal image & document understanding)
    if (ENV.GEMINI_API_KEY) {
      // Prioritize ultra-low latency responsive models (gemini-3.5-flash-lite / gemini-3.5-flash respond in ~1.5s)
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3-flash-preview'];
      const systemPrompt = `You are "AI Mentor", an elite Principal Technical Interviewer and Career Coach specializing in software engineering interviews, architecture, coding problem strategies, and resume critique.
- If the candidate attached a photo, image, whiteboard sketch, or document, examine it thoroughly and provide direct, actionable technical feedback.
- If reviewing code or architecture, detail strengths, edge-case vulnerabilities, time/space complexity, and improvements.
- Provide crisp, encouraging, highly structured responses using clean markdown formatting, bold points, and code snippets where appropriate.
${userProfile?.targetRole ? `- Candidate Target Role: ${userProfile.targetRole}` : ''}
${userProfile?.skills ? `- Candidate Skills: ${userProfile.skills}` : ''}

Conversation History:
${historyText}

Candidate's Latest Message:
${userMessage}
${attachment ? `(Candidate attached file: "${attachment.name}" [${attachment.type}])` : ''}

AI Mentor Response:`;

      const parts: any[] = [{ text: systemPrompt }];

      if (attachment && attachment.data && attachment.type) {
        const sanitizedMime = attachment.type.split(';')[0].trim() || 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType: sanitizedMime,
            data: attachment.data,
          },
        });
      }

      for (const model of candidateModels) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
            {
              contents: [
                {
                  parts,
                },
              ],
            },
            { timeout: 10000 }
          );

          const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            aiReply = text.trim();
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[ChatService] Gemini model '${model}' failed (${modelErr?.response?.status || modelErr?.message}), trying fallback...`);
        }
      }
    }

    // B. Priority 2: Call Python ML Microservice (FastAPI + RAG + Gemini LLM)
    if (!aiReply) {
      try {
        const mlServiceUrl = ENV.ML_SERVICE_URL || 'http://127.0.0.1:8001';
        const mlResponse = await axios.post(
          `${mlServiceUrl}/api/ai/chat`,
          {
            message: userMessage,
            context,
            history: historyText,
            user_profile: userProfile
              ? {
                  targetRole: userProfile.targetRole || 'Software Engineer',
                  skills: userProfile.skills || '',
                }
              : undefined,
          },
          { timeout: 20000 }
        );

        if (mlResponse.data?.reply) {
          aiReply = mlResponse.data.reply;
        }
      } catch (err: any) {
        console.log(
          '[ChatService] ML microservice error:',
          err?.response?.status,
          err?.message || err
        );
      }
    }

    // C. Priority 3: Built-in Intelligent Coaching Engine (Comprehensive Offline Fallback)
    if (!aiReply) {
      const lower = userMessage.toLowerCase();
      
      // Behavioral & Strategy
      if (lower.includes('salary') || lower.includes('negotiat')) {
        aiReply = `💼 **Salary & Negotiation Strategy:**\n\n1. **Research:** Know the market rate for the role in your area.\n2. **Value First:** Emphasize your technical stack (React, Node, etc.) and what you bring to the table.\n3. **Growth:** Ask about review cycles and learning budgets rather than just base pay.`;
      } else if (lower.includes('star') || lower.includes('behavioral')) {
        aiReply = `🎯 **The STAR Framework:**\n\n• **Situation:** Context of the project or challenge.\n• **Task:** Your specific responsibility.\n• **Action:** The technical steps YOU took to solve it.\n• **Result:** The quantifiable business impact (e.g., "Reduced load time by 2s").`;
      } else if (lower.includes('system design') || lower.includes('scale')) {
        aiReply = `⚡ **System Design Blueprint:**\n\n1. **Requirements:** Clarify RPS, read/write ratio.\n2. **High-Level:** API Gateway -> Load Balancer -> Microservices -> Cache -> DB.\n3. **Deep Dive:** Discuss Trade-offs (CAP theorem, caching strategies, message queues like Kafka).`;
      } 
      // JS Frameworks
      else if (lower.includes('react') || lower.includes('nextjs')) {
        aiReply = `⚛️ **React & Next.js Interview Knowledge:**\n\n- **Virtual DOM:** React uses a V-DOM to batch UI updates efficiently.\n- **Hooks:** Understand \`useState\`, \`useEffect\` (lifecycle), and \`useMemo\`/\`useCallback\` (performance).\n- **Next.js:** Focus on SSR (Server-Side Rendering) vs SSG (Static Site Generation), and how it improves SEO and initial load time.\n- **State Management:** Be ready to discuss Redux, Context API, or Zustand.`;
      } else if (lower.includes('angular')) {
        aiReply = `🛡️ **Angular Interview Knowledge:**\n\n- **Architecture:** Understand Modules, Components, Services, and Dependency Injection.\n- **RxJS:** Observables, Subjects, and operators like \`map\`, \`switchMap\` are heavily tested.\n- **Change Detection:** Know how Zone.js works and the difference between Default and OnPush change detection strategies.`;
      } else if (lower.includes('vue')) {
        aiReply = `🟢 **Vue.js Interview Knowledge:**\n\n- **Reactivity:** Understand how Vue tracks dependencies using Proxies (Vue 3) or Object.defineProperty (Vue 2).\n- **Composition API:** Be able to explain \`setup()\`, \`ref\`, and \`reactive\` vs the Options API.\n- **Directives:** Know core directives like \`v-model\`, \`v-if\` vs \`v-show\`, and \`v-for\` (always use keys!).`;
      }
      // Backend & Languages
      else if (lower.includes('node') || lower.includes('express')) {
        aiReply = `🟩 **Node.js & Express Knowledge:**\n\n- **Event Loop:** Crucial topic! Node is single-threaded but handles async I/O via the event loop (timers, poll, check phases).\n- **Express:** Middleware architecture, error handling, and routing.\n- **Performance:** Don't block the event loop. Use worker threads for CPU-intensive tasks. Streams for large data.`;
      } else if (lower.includes('python') || lower.includes('django') || lower.includes('fastapi')) {
        aiReply = `🐍 **Python Interview Knowledge:**\n\n- **Core:** GIL (Global Interpreter Lock), list comprehensions, decorators, and generators.\n- **FastAPI:** Async support, Pydantic data validation, dependency injection.\n- **Django:** ORM (Object-Relational Mapping), MVC (MVT) architecture, and middleware.`;
      } else if (lower.includes('java ') || lower.includes('spring')) {
        aiReply = `☕ **Java & Spring Boot Knowledge:**\n\n- **OOP:** Encapsulation, Inheritance, Polymorphism, Abstraction.\n- **JVM:** Memory management (Heap vs Stack), Garbage Collection algorithms.\n- **Spring:** Dependency Injection (IoC), Spring MVC, Spring Data JPA, and annotations like \`@RestController\` and \`@Autowired\`.`;
      } else if (lower.includes('javascript') || lower.includes('js')) {
        aiReply = `📜 **JavaScript Core Concepts:**\n\n- **Closures:** Functions that remember the environment in which they were created.\n- **Hoisting:** Variable and function declarations moved to the top of their scope.\n- **Promises & Async/Await:** Handling asynchronous code effectively.\n- **Event Delegation:** Attaching a single event listener to a parent element.`;
      }
      // Databases
      else if (lower.includes('sql') || lower.includes('database') || lower.includes('mongodb')) {
        aiReply = `🗄️ **Database Knowledge (SQL vs NoSQL):**\n\n- **SQL (Postgres/MySQL):** ACID properties, Normalization (1NF, 2NF, 3NF), Joins, and Indexes (B-Trees).\n- **NoSQL (MongoDB):** Schema-less document storage, eventual consistency, horizontal scaling (sharding).\n- **When to use:** SQL for structured, relational data. NoSQL for flexible schema or massive scale.`;
      } else if (lower.includes('api') || lower.includes('rest') || lower.includes('graphql')) {
        aiReply = `🌐 **API Design (REST vs GraphQL):**\n\n- **REST:** Stateless, resource-based URIs, standard HTTP methods (GET, POST, PUT, DELETE).\n- **GraphQL:** Client specifies exactly what data it needs. Solves over-fetching and under-fetching. Single endpoint.\n- **Security:** Always mention JWT, rate limiting, and CORS.`;
      }
      // Default Generic
      else {
        aiReply = `🤖 **Offline AI Mentor:**\n\nI am currently operating in offline fallback mode.\n\nHowever, in any technical interview, always remember to:\n1. **Clarify the problem** before writing any code.\n2. **Discuss Trade-offs** (Time complexity vs Space complexity).\n3. **Think aloud** so the interviewer understands your problem-solving process.\n\nYou can ask me specific questions about React, Angular, Node, Python, Java, SQL, or System Design!`;
      }
    }

    // 3. Save AI reply to database
    const savedAiMessage = await prisma.chatMessage.create({
      data: {
        userId,
        sender: 'AI',
        message: aiReply,
        context,
      },
    });

    return savedAiMessage;
  }

  static async getChatHistory(userId: string) {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }
}
