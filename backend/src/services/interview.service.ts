import { prisma } from '../config/prisma';
import { AIService } from './ai.service';
import { ApiError } from '../utils/apiError';

export interface StartInterviewDTO {
  userId: string;
  type: string; // BEHAVIORAL, TECHNICAL, SYSTEM_DESIGN
  role?: string;
  difficulty?: string;
}

export interface SubmitAnswerDTO {
  sessionId: string;
  questionId: string;
  userAnswer: string;
  audioUrl?: string;
}

export class InterviewService {
  static async startSession(dto: StartInterviewDTO) {
    const role = dto.role || 'Software Engineer';
    const difficulty = dto.difficulty || 'Medium';
    const type = dto.type || 'TECHNICAL';

    // 1. Generate questions via AI service
    const generatedQuestions = await AIService.generateQuestions(role, type, difficulty, 5);

    // 2. Create InterviewSession in Database
    const session = await prisma.interviewSession.create({
      data: {
        userId: dto.userId,
        type,
        role,
        difficulty,
        status: 'IN_PROGRESS',
        questions: {
          create: generatedQuestions.map((q) => ({
            questionText: q.questionText,
            category: q.category,
            difficulty: q.difficulty,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return session;
  }

  static async submitAnswer(dto: SubmitAnswerDTO) {
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: dto.questionId },
      include: { session: true },
    });

    if (!question) {
      throw ApiError.notFound('Interview question not found.');
    }

    // Evaluate answer with AI
    const evaluation = await AIService.evaluateAnswer(
      question.questionText,
      dto.userAnswer,
      question.session.role
    );

    // Update Question with user answer and AI feedback
    const updatedQuestion = await prisma.interviewQuestion.update({
      where: { id: dto.questionId },
      data: {
        userAnswer: dto.userAnswer,
        audioUrl: dto.audioUrl,
        score: evaluation.score,
        aiFeedback: JSON.stringify(evaluation),
      },
    });

    return {
      question: updatedQuestion,
      evaluation,
    };
  }

  static async completeSession(sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });

    if (!session) {
      throw ApiError.notFound('Interview session not found.');
    }

    const answered = session.questions.filter((q) => q.score !== null);
    const overallScore = answered.length > 0
      ? Math.round(answered.reduce((acc, q) => acc + (q.score || 0), 0) / answered.length)
      : 70;

    const completed = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        overallScore,
        feedback: `Completed with ${overallScore}% overall readiness rating across ${answered.length} answered questions.`,
      },
      include: { questions: true },
    });

    // Increment user readiness score
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        readinessScore: {
          increment: 2,
        },
      },
    });

    return completed;
  }

  static async getUserSessions(userId: string) {
    return prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: true,
      },
    });
  }

  static async getSessionById(sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });

    if (!session) {
      throw ApiError.notFound('Session not found.');
    }

    return session;
  }
}
