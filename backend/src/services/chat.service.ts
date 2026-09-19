import axios from 'axios';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

export class ChatService {
  static async sendMessage(userId: string, userMessage: string, context = 'INTERVIEW_COACH') {
    // 1. Fetch recent conversation history to provide multi-turn context memory to the LLM
    const pastMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // 2. Save user message to database
    await prisma.chatMessage.create({
      data: {
        userId,
        sender: 'USER',
        message: userMessage,
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

    // A. Priority 1: Call Python ML Microservice (FastAPI + RAG + Gemini LLM)
    try {
      const mlServiceUrl = ENV.ML_SERVICE_URL || 'http://localhost:8001';
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
        { timeout: 15000 }
      );

      if (mlResponse.data?.reply) {
        aiReply = mlResponse.data.reply;
      }
    } catch (err: any) {
      console.log(
        'Python ML microservice (RAG) not reachable or timed out, trying direct Gemini API...'
      );
    }

    // B. Priority 2: Direct Google Gemini 1.5 Flash API Call (without RAG)
    if (!aiReply && ENV.GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are "AI Mentor", an elite Principal Technical Interviewer and Career Coach specializing in software engineering internships, junior developer roles, and tech interviews in Sri Lanka and globally.
Provide a crisp, encouraging, highly structured response using markdown formatting, bullet points, and real-world software engineering best practices (STAR method, system design tradeoffs, algorithmic complexity).

Conversation History:
${historyText}

Candidate's Latest Question:
${userMessage}

AI Mentor Response:`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          aiReply = text.trim();
        }
      } catch (err: any) {
        console.warn('Gemini direct API call failed:', err.message);
      }
    }

    // C. Priority 3: Built-in Intelligent Coaching Engine
    if (!aiReply) {
      const lower = userMessage.toLowerCase();
      if (lower.includes('salary') || lower.includes('negotiat')) {
        aiReply = `💼 **Salary & Internship Offer Negotiation Strategy:**\n\n1. **Research the Market:** In Sri Lanka's top tech firms (Sysco LABS, 99x, WSO2, IFS, Virtusa), bands are standardized. Know your target tier.\n2. **Highlight Direct Value:** Emphasize hands-on full-stack projects, TypeScript rigor, and fast onboarding ability.\n3. **Negotiate Growth Opportunities:** Ask about annual appraisal cycles, certifications, and permanent placement bonuses.`;
      } else if (lower.includes('star') || lower.includes('behavioral')) {
        aiReply = `🎯 **The STAR Framework for Behavioral Interview Mastery:**\n\n• **Situation:** 1-2 sentences setting the project context and technical stakes.\n• **Task:** The specific challenge or requirement you owned.\n• **Action:** Concrete technical decisions *YOU* made ("I refactored the API layer...", "I introduced Redis caching...").\n• **Result:** Quantifiable business impact (e.g. "Reduced response latency by 45% with 0 downtime").`;
      } else if (lower.includes('system design') || lower.includes('scale') || lower.includes('architecture')) {
        aiReply = `⚡ **System Design Interview Blueprint:**\n\n1. **Clarify Constraints:** RPS/QPS, read/write ratio, latency SLA, and storage growth.\n2. **High-Level Design:** API Gateway -> Load Balancer -> Stateless Microservices -> Cache (Redis) -> Relational DB / Read Replicas.\n3. **Deep Dive Bottlenecks:** Message queues (RabbitMQ/Kafka) for async tasks, DB indexing (B-Trees), and horizontal scaling.`;
      } else {
        aiReply = `Great question! When answering this in technical interviews:\n\n1. **State your assumptions clearly** before jumping into code or solutions.\n2. **Discuss Trade-offs:** Compare Time vs Space complexity.\n3. **Structure your thoughts:** Break complex requirements into modular components.\n\nWould you like to practice a mock interview question on this topic now?`;
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
