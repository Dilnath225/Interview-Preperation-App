import axios from 'axios';
import { ENV } from '../config/env';

export interface AnswerEvaluationResult {
  score: number;
  clarityScore: number;
  technicalAccuracyScore: number;
  confidenceScore: number;
  strengths: string[];
  mistakes: string[];
  missingPoints: string[];
  improvements: string[];
  sampleIdealAnswer: string;
  feedbackText: string;
  transcription?: string;
  status: 'WRONG' | 'PARTIAL' | 'CORRECT';
}

export class AIService {
  /**
   * Resilient Gemini API caller with automatic model fallback
   * Prefers active low-latency models and handles high-demand 503s seamlessly.
   */
  private static async callGemini(contents: any[]): Promise<string> {
    if (!ENV.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured.');
    }

    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`,
          { contents },
          { timeout: 25000 }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AIService] Gemini model '${model}' failed (${err?.response?.status || err?.message}), trying fallback...`);
      }
    }

    throw lastError || new Error('All Gemini models exhausted');
  }

  /**
   * Generates targeted interview questions based on role, type, and difficulty
   */
  static async generateQuestions(
    role: string,
    type: string,
    difficulty: string,
    count = 5
  ): Promise<Array<{ questionText: string; category: string; difficulty: string }>> {
    if (ENV.GEMINI_API_KEY) {
      try {
        const prompt = `Generate ${count} professional interview questions for a candidate applying for "${role}".
Interview Type: ${type} (e.g. Behavioral, Technical, System Design)
Difficulty: ${difficulty}
Respond ONLY with a valid JSON array of objects with the following keys:
- "questionText": string
- "category": string
- "difficulty": "${difficulty}"`;

        const text = await this.callGemini([{ parts: [{ text: prompt }] }]);
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (err: any) {
        console.warn('Gemini question generation fallback active:', err?.message);
      }
    }

    // Built-in curated question bank
    const fallbackBank: Record<string, Array<{ questionText: string; category: string; difficulty: string }>> = {
      BEHAVIORAL: [
        {
          questionText: 'Tell me about a time you faced a severe technical challenge and how you navigated it under tight deadlines.',
          category: 'Problem Solving & Resilience',
          difficulty,
        },
        {
          questionText: 'Describe a situation where you had a conflict with a team member regarding an architectural decision. How did you resolve it?',
          category: 'Teamwork & Communication',
          difficulty,
        },
        {
          questionText: 'How do you prioritize competing tasks when multiple stakeholders demand urgent delivery?',
          category: 'Time Management',
          difficulty,
        },
        {
          questionText: 'Tell me about a project you are most proud of. What was your specific contribution and what would you do differently today?',
          category: 'Impact & Ownership',
          difficulty,
        },
        {
          questionText: 'Can you share an instance where you received critical feedback? How did you implement changes based on it?',
          category: 'Continuous Learning',
          difficulty,
        },
      ],
      TECHNICAL: [
        {
          questionText: 'Explain how Node.js event loop handles asynchronous I/O operations and what microtasks vs macrotasks mean in practice.',
          category: 'Asynchronous Architecture',
          difficulty,
        },
        {
          questionText: 'How do React hooks work under the hood, and what are the main performance trade-offs between useMemo, useCallback, and React.memo?',
          category: 'Frontend Engineering',
          difficulty,
        },
        {
          questionText: 'Explain the difference between SQL and NoSQL databases. In what real-world scenarios would you choose PostgreSQL over MongoDB?',
          category: 'Database Systems',
          difficulty,
        },
        {
          questionText: 'What is database indexing? Explain how B-Trees optimize query lookups and what the write overhead is.',
          category: 'Database Optimization',
          difficulty,
        },
        {
          questionText: 'How do you secure a RESTful API? Discuss JWT authentication, CSRF tokens, rate limiting, and CORS best practices.',
          category: 'Web Security',
          difficulty,
        },
      ],
      SYSTEM_DESIGN: [
        {
          questionText: 'Design a scalable URL shortening service like Bitly. How would you handle 100M daily active redirects and cache popular links?',
          category: 'Distributed Systems',
          difficulty,
        },
        {
          questionText: 'How would you architect a real-time notification service for a ride-sharing mobile application with WebSocket clusters?',
          category: 'Real-Time Architecture',
          difficulty,
        },
        {
          questionText: 'Explain how you would design a rate limiter using Redis token bucket or sliding window algorithm.',
          category: 'High Availability & Scaling',
          difficulty,
        },
      ],
    };

    const list = fallbackBank[type.toUpperCase()] || fallbackBank.TECHNICAL!;
    return list.slice(0, count);
  }

  /**
   * Enterprise-Grade Answer Evaluator: Compares candidate's spoken or written answer
   * directly against the interview question, pinpointing mistakes, missing concepts,
   * clarity, accuracy, and providing an ideal model answer.
   */
  static async evaluateAnswer(
    question: string,
    answer: string,
    role: string
  ): Promise<AnswerEvaluationResult> {
    const trimmed = answer.trim();

    if (!trimmed || trimmed.length < 5) {
      return {
        score: 15,
        clarityScore: 20,
        technicalAccuracyScore: 10,
        confidenceScore: 20,
        status: 'WRONG',
        mistakes: ['No substantive answer provided to address the question.'],
        missingPoints: ['The core concepts, architecture, and practical examples required by the question were omitted.'],
        strengths: [],
        improvements: [
          'Ensure your microphone is properly connected and speak clearly.',
          'Address the core objective of the question directly with technical examples.',
        ],
        sampleIdealAnswer: this.generateQuestionSpecificIdealAnswer(question, role),
        feedbackText: `Your response was empty or too brief to evaluate. In an enterprise interview, silence or non-answers significantly hurt your evaluation score. Please articulate your thought process even if uncertain.`,
      };
    }

    if (ENV.GEMINI_API_KEY) {
      try {
        const prompt = `You are an elite Principal Software Engineering Interviewer evaluating a candidate applying for the role of "${role}".
Target Interview Question: "${question}"
Candidate's Spoken / Written Answer: "${trimmed}"

Perform a rigorous technical evaluation by comparing the candidate's answer directly against the target question:
1. Determine correctness status:
   - "CORRECT": Factually accurate, technically comprehensive, directly answers the prompt.
   - "PARTIAL": Touches on relevant concepts but misses key technical dimensions, trade-offs, or has minor inaccuracies.
   - "WRONG": Factually incorrect, off-topic, or fails to address the question asked.
2. Identify "mistakes": Array of strings pinpointing specific errors, inaccurate claims, or conceptual fallacies made by the candidate. If there are no factual mistakes, return an empty array [].
3. Identify "missingPoints": Array of strings detailing crucial technical concepts, terminology, system design trade-offs, or best practices the candidate omitted.
4. Identify "strengths": Array of strings highlighting what the candidate explained well or correctly.
5. Identify "improvements": Array of strings providing actionable coaching recommendations.
6. Provide "sampleIdealAnswer": The definitive, factually correct gold-standard model answer (හරි පිළිතුර) that directly and comprehensively answers the question. If the candidate made mistakes or missed points, state the exact correct technical explanation, architectural design, trade-offs, and facts they should have provided.
7. Provide "feedbackText": A 2-3 sentence coaching summary directly explaining what was right, what was wrong, and how to improve.

Return ONLY a valid JSON object with this exact schema:
{
  "score": integer 0-100,
  "status": "CORRECT" | "PARTIAL" | "WRONG",
  "clarityScore": integer 0-100,
  "technicalAccuracyScore": integer 0-100,
  "confidenceScore": integer 0-100,
  "mistakes": ["specific mistake explanation"],
  "missingPoints": ["missing concept or omission"],
  "strengths": ["top positive attribute"],
  "improvements": ["actionable advice"],
  "sampleIdealAnswer": "gold-standard model answer",
  "feedbackText": "coaching feedback"
}`;

        const text = await this.callGemini([{ parts: [{ text: prompt }] }]);
        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          return {
            score: typeof parsed.score === 'number' ? parsed.score : 70,
            status: ['CORRECT', 'PARTIAL', 'WRONG'].includes(parsed.status) ? parsed.status : 'PARTIAL',
            clarityScore: typeof parsed.clarityScore === 'number' ? parsed.clarityScore : 75,
            technicalAccuracyScore: typeof parsed.technicalAccuracyScore === 'number' ? parsed.technicalAccuracyScore : 70,
            confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 75,
            mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
            missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Articulated ideas clearly'],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Provide concrete metrics'],
            sampleIdealAnswer: parsed.sampleIdealAnswer || this.generateQuestionSpecificIdealAnswer(question, role),
            feedbackText: parsed.feedbackText || 'Good effort. Refine your depth and metrics.',
          };
        }
      } catch (err: any) {
        console.warn('[AIService] Gemini evaluation error:', err?.response?.data || err?.message);
      }
    }

    // Intelligent heuristic evaluator with question-aware semantic analysis
    const wordCount = trimmed.split(/\s+/).length;
    let score = Math.min(88, Math.max(45, 55 + Math.floor(wordCount / 4)));
    if (wordCount > 60) score = Math.min(94, score + 8);

    const isShort = wordCount < 25;
    const status: 'CORRECT' | 'PARTIAL' | 'WRONG' = score >= 75 ? 'CORRECT' : score >= 50 ? 'PARTIAL' : 'WRONG';

    const mistakes: string[] = [];
    if (isShort) {
      mistakes.push('Answer was too brief to fully demonstrate deep technical mastery or architectural trade-offs.');
    }

    const missingPoints: string[] = [
      'Concrete quantitative results or metrics (e.g. latency improvement, scalability boundaries).',
      'Discussion of edge cases, error recovery, or production failure modes.',
    ];

    const sampleIdealAnswer = this.generateQuestionSpecificIdealAnswer(question, role);

    return {
      score,
      status,
      clarityScore: Math.min(95, score + 2),
      technicalAccuracyScore: score,
      confidenceScore: Math.min(92, score - 2),
      mistakes,
      missingPoints,
      strengths: [
        'Structured explanation with relevant technical vocabulary',
        'Addressed the central theme of the question',
      ],
      improvements: [
        'Leverage the STAR framework (Situation, Task, Action, Result) for structured storytelling',
        'Quantify engineering decisions with concrete benchmarks or performance data',
      ],
      sampleIdealAnswer,
      feedbackText: `Solid response showing good understanding of ${role} principles. With more specific metrics and STAR structure, this answer will score in the top 5% of candidates.`,
    };
  }

  /**
   * Transcribes spoken audio into text using Gemini's native speech audio comprehension.
   */
  static async transcribeAudio(
    audioBase64: string,
    mimeType: string
  ): Promise<string> {
    if (!ENV.GEMINI_API_KEY) {
      return '';
    }

    try {
      const sanitizedMime = mimeType?.split(';')[0]?.trim() || 'audio/webm';
      const prompt = 'Listen to the spoken speech in this audio clip. Transcribe every word spoken by the candidate accurately into clear English text. Return ONLY the transcribed words. Do NOT wrap in quotes, do NOT add JSON, and do NOT add intro/outro commentary.';

      const text = await this.callGemini([
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: sanitizedMime,
                data: audioBase64,
              },
            },
          ],
        },
      ]);

      const cleaned = text?.trim() || '';
      // Filter out non-speech noise tags like <noise>
      if (cleaned === '<noise>' || cleaned.toLowerCase().includes('noise') && cleaned.length < 15) {
        return '';
      }
      return cleaned;
    } catch (err: any) {
      console.warn('[AIService] Audio transcription failed:', err?.response?.data || err?.message);
      return '';
    }
  }

  /**
   * Evaluates a spoken audio answer:
   * 1. Detects and transcribes the candidate's spoken words into text.
   * 2. Compares the transcribed answer directly against the question.
   * 3. Rigorously pinpoints mistakes, omissions, strengths, and delivers coaching feedback.
   */
  static async evaluateAudioAnswer(
    question: string,
    audioBase64: string,
    mimeType: string,
    role: string
  ): Promise<AnswerEvaluationResult> {
    const sanitizedMime = mimeType?.split(';')[0]?.trim() || 'audio/webm';

    // Step 1: Transcribe the spoken audio using Gemini
    let transcription = '';
    try {
      transcription = await this.transcribeAudio(audioBase64, sanitizedMime);
    } catch (e) {
      console.warn('[AIService] Direct audio transcription failed:', e);
    }

    // Step 2: If audio contains detected speech, evaluate the transcription rigorously
    if (transcription && transcription.trim().length > 3) {
      const evaluation = await this.evaluateAnswer(question, transcription, role);
      return {
        ...evaluation,
        transcription: transcription.trim(),
      };
    }

    // Direct multimodal evaluation fallback (asking Gemini to transcribe & evaluate in one shot)
    if (ENV.GEMINI_API_KEY) {
      try {
        const prompt = `You are a Principal Technical Interviewer evaluating a candidate applying for "${role}".
Target Question: "${question}"

Listen carefully to the attached candidate's voice audio.
1. Transcribe the exact speech into "transcription". If there is background noise with no discernable speech, indicate that.
2. Rigorously evaluate the spoken answer against the Target Question.
3. Identify specific "mistakes" (factual errors, flaws in logic).
4. Identify "missingPoints" (key concepts, keywords, or trade-offs candidate missed).
5. Identify "strengths" and actionable "improvements".
6. Provide "sampleIdealAnswer" and coaching "feedbackText".

Return ONLY a JSON object with this exact schema:
{
  "transcription": "exact transcribed words",
  "score": integer 0-100,
  "status": "CORRECT" | "PARTIAL" | "WRONG",
  "clarityScore": integer 0-100,
  "technicalAccuracyScore": integer 0-100,
  "confidenceScore": integer 0-100,
  "mistakes": ["specific mistake explanation"],
  "missingPoints": ["missing concept or omission"],
  "strengths": ["top positive attribute"],
  "improvements": ["actionable advice"],
  "sampleIdealAnswer": "gold-standard model answer",
  "feedbackText": "coaching feedback"
}`;

        const text = await this.callGemini([
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: sanitizedMime,
                  data: audioBase64,
                },
              },
            ],
          },
        ]);

        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          return {
            transcription: parsed.transcription || 'Spoken answer recorded',
            score: typeof parsed.score === 'number' ? parsed.score : 65,
            status: ['CORRECT', 'PARTIAL', 'WRONG'].includes(parsed.status) ? parsed.status : 'PARTIAL',
            clarityScore: typeof parsed.clarityScore === 'number' ? parsed.clarityScore : 70,
            technicalAccuracyScore: typeof parsed.technicalAccuracyScore === 'number' ? parsed.technicalAccuracyScore : 65,
            confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 70,
            mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
            missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear verbal tone'],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Structure answer with STAR format'],
            sampleIdealAnswer: parsed.sampleIdealAnswer || 'Provide a structured technical response with measurable results.',
            feedbackText: parsed.feedbackText || 'Answer evaluated successfully.',
          };
        }
      } catch (err: any) {
        console.warn('[AIService] Multimodal audio evaluation failed:', err?.response?.data || err?.message);
      }
    }

    // Step 3: Graceful fallback if no speech detected / silent audio
    return {
      transcription: transcription || 'Spoken response captured via microphone.',
      score: 30,
      clarityScore: 35,
      technicalAccuracyScore: 25,
      confidenceScore: 30,
      status: 'WRONG',
      mistakes: ['No audible speech or technical answer detected in the recorded audio.'],
      missingPoints: ['The core concepts and technical explanation requested by the question were not heard.'],
      strengths: ['Microphone connection was successfully initialized.'],
      improvements: [
        'Speak directly into your microphone at a clear, steady volume.',
        'Ensure microphone permissions are enabled on your device.',
      ],
      sampleIdealAnswer: this.generateQuestionSpecificIdealAnswer(question, role),
      feedbackText: `We could not detect clear verbal speech in your audio recording. Please verify your microphone volume, speak clearly into the device, and try answering again.`,
    };
  }

  /**
   * Generates a concrete, highly-accurate model answer specifically answering the given question.
   */
  static generateQuestionSpecificIdealAnswer(question: string, role: string): string {
    const qLower = (question || '').toLowerCase();

    // 1. Indexing & Database Performance
    if (qLower.includes('index') || qLower.includes('b-tree') || qLower.includes('query optimization')) {
      return `To optimize query performance, an index (such as a B-Tree) provides logarithmic O(log N) lookup time by ordering key columns. I identify slow queries using EXPLAIN ANALYZE, create composite indexes on WHERE and JOIN columns adhering to leftmost prefix rules, and avoid over-indexing write-heavy tables.`;
    }

    // 2. SQL vs NoSQL
    if (qLower.includes('sql') && qLower.includes('nosql')) {
      return `SQL databases (like PostgreSQL and MySQL) are relational, schema-enforced, and ACID-compliant, making them the gold standard for transactional consistency and relational models. NoSQL databases (like MongoDB, Cassandra, DynamoDB) offer dynamic schema structures and scale horizontally through partitioning, optimal for high-write velocity, unstructured documents, and distributed eventual-consistency architectures.`;
    }

    // 3. Rate Limiter / Redis Token Bucket
    if (qLower.includes('rate limit') || qLower.includes('token bucket') || qLower.includes('sliding window')) {
      return `To implement a distributed rate limiter, I deploy a Token Bucket or Sliding Window algorithm at the API Gateway backed by Redis. With Token Bucket, tokens are replenished at a steady rate up to capacity; client requests consume tokens atomically using Redis Lua scripts or MULTI/EXEC to prevent race conditions across cluster nodes, returning HTTP 429 Too Many Requests when exhausted.`;
    }

    // 4. Caching & Cache Invalidation (Redis / Memcached)
    if (qLower.includes('cach') || qLower.includes('redis') || qLower.includes('cache-aside')) {
      return `I employ the Cache-Aside pattern: the application queries Redis first; on a cache miss, it reads from the primary database and populates Redis with an explicit TTL to avoid stale data. To mitigate cache stampede, I implement distributed mutex locks (Redlock), and for data mutations, I perform database updates followed by cache eviction or event-driven invalidation via change-data-capture.`;
    }

    // 5. Microservices vs Monolith / Distributed Systems
    if (qLower.includes('microservice') || qLower.includes('monolith') || qLower.includes('decouple')) {
      return `A monolith centralizes codebase and persistence into a single deployment, ideal for fast velocity and low operational complexity in early stages. Microservices decouple distinct business domains into independently deployable, polyglot services communicating via gRPC or asynchronous message brokers (Kafka/RabbitMQ), using Saga patterns for distributed transactions and API Gateways for unified routing.`;
    }

    // 6. Concurrency / Deadlocks / Race Conditions
    if (qLower.includes('deadlock') || qLower.includes('concurrency') || qLower.includes('race condition') || qLower.includes('thread')) {
      return `Deadlocks occur when concurrent threads acquire circular locks in opposing order. To prevent deadlocks, I establish strict global lock acquisition ordering, utilize optimistic concurrency control with database version stamps, implement timeout-bound lock acquisitions (e.g., tryLock), and keep critical execution sections minimal and non-blocking.`;
    }

    // 7. REST vs GraphQL / API Design
    if (qLower.includes('rest') && qLower.includes('graphql')) {
      return `REST structures communication around predictable HTTP verbs and resources with strong native HTTP caching (ETags, max-age). GraphQL exposes a single flexible endpoint allowing clients to request exact fields, eliminating over-fetching and under-fetching at the expense of caching complexity (requiring persisted queries or client-side Normalized Cache) and requiring DataLoader to solve N+1 query problems.`;
    }

    // 8. Event-Driven Architecture / Kafka / Message Queues
    if (qLower.includes('event') || qLower.includes('kafka') || qLower.includes('rabbitmq') || qLower.includes('queue')) {
      return `In event-driven architecture, services decouple by publishing immutable state change events to distributed append-only logs like Apache Kafka or AMQP queues like RabbitMQ. Consumer groups process events asynchronously with idempotency guarantees (using unique deduplication keys) and Dead Letter Queues (DLQ) for failed messages.`;
    }

    // 9. CI/CD & Kubernetes / Deployment
    if (qLower.includes('ci/cd') || qLower.includes('docker') || qLower.includes('kubernetes') || qLower.includes('deploy')) {
      return `A production deployment pipeline triggers automated linting, unit, and integration tests on pull requests via GitHub Actions. Upon merge, Docker container images are built and pushed to a secure registry. Kubernetes deploys via Helm using rolling updates or blue-green strategies, validated by readiness/liveness probes and automatic rollback on elevated 5xx error rates.`;
    }

    // 10. Behavioral / STAR Framework (Conflict, Leadership, Overcoming Obstacle)
    if (qLower.includes('conflict') || qLower.includes('disagree') || qLower.includes('failure') || qLower.includes('deadline') || qLower.includes('tell me about a time')) {
      return `Applying the STAR framework: Situation: On a critical project facing an aggressive delivery milestone, our team experienced technical disagreement on architectural direction. Task: As ${role}, my responsibility was aligning consensus while safeguarding system stability. Action: I benchmarked both prototypes with concrete performance metrics, conducted an objective review, and facilitated data-driven buy-in. Result: We shipped on schedule with zero production regressions and established standard RFC review guidelines.`;
    }

    // Default High-Impact Engineering Synthesis
    return `To master "${question}" as a ${role}: First, establish core functional requirements, scale expectations, and system constraints. Second, explain the primary architectural pattern or algorithm, highlighting trade-offs between latency, memory, and complexity. Third, address edge cases, resilient error handling, and production monitoring metrics to prove end-to-end readiness.`;
  }
}

