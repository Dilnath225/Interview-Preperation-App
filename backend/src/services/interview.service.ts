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

  static async completeSession(
    sessionId: string,
    answers?: Array<{ questionId: string; userAnswer: string }>
  ) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });

    if (!session) {
      throw ApiError.notFound('Interview session not found.');
    }

    const answersMap = new Map<string, string>();
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        if (ans && ans.questionId) {
          answersMap.set(ans.questionId, (ans.userAnswer || '').trim());
        }
      });
    }

    // Process each question: ensure user answer and AI evaluation (with model answer) are stored
    const evaluatedQuestions = [];
    let totalScore = 0;
    let totalClarity = 0;
    let totalTech = 0;
    let totalConf = 0;
    let correctCount = 0;
    let partialCount = 0;
    let wrongCount = 0;

    for (const q of session.questions) {
      let finalAnswer = (q.userAnswer || '').trim();
      if (answersMap.has(q.id)) {
        finalAnswer = answersMap.get(q.id)!;
      }

      let parsedFeedback: any = null;
      let score = q.score;

      // If already evaluated and has aiFeedback and answer didn't change
      if (q.aiFeedback && score !== null && finalAnswer === (q.userAnswer || '').trim()) {
        try {
          parsedFeedback = JSON.parse(q.aiFeedback);
        } catch (e) {
          parsedFeedback = null;
        }
      }

      // If not yet evaluated or answer was updated: evaluate now
      if (!parsedFeedback || score === null) {
        const evaluation = await AIService.evaluateAnswer(
          q.questionText,
          finalAnswer,
          session.role
        );
        score = evaluation.score;
        parsedFeedback = evaluation;

        await prisma.interviewQuestion.update({
          where: { id: q.id },
          data: {
            userAnswer: finalAnswer,
            score,
            aiFeedback: JSON.stringify(evaluation),
          },
        });
      }

      totalScore += score || 0;
      totalClarity += parsedFeedback?.clarityScore || score || 70;
      totalTech += parsedFeedback?.technicalAccuracyScore || score || 70;
      totalConf += parsedFeedback?.confidenceScore || score || 70;

      const status = parsedFeedback?.status || (score >= 70 ? 'CORRECT' : score >= 45 ? 'PARTIAL' : 'WRONG');
      if (status === 'CORRECT') correctCount++;
      else if (status === 'PARTIAL') partialCount++;
      else wrongCount++;

      evaluatedQuestions.push({
        ...q,
        userAnswer: finalAnswer,
        score,
        aiFeedback: JSON.stringify(parsedFeedback),
        evaluation: parsedFeedback,
      });
    }

    const qCount = session.questions.length || 1;
    const overallScore = Math.round(totalScore / qCount);

    const diagnosticSummary = {
      overallScore,
      avgClarity: Math.round(totalClarity / qCount),
      avgTechnicalAccuracy: Math.round(totalTech / qCount),
      avgConfidence: Math.round(totalConf / qCount),
      correctCount,
      partialCount,
      wrongCount,
      totalQuestions: session.questions.length,
      status: overallScore >= 70 ? 'ENTERPRISE_READY' : overallScore >= 45 ? 'COMPETENT' : 'NEEDS_PRACTICE',
      readinessPointsEarned: 2,
    };

    const completed = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        overallScore,
        feedback: JSON.stringify(diagnosticSummary),
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

    return {
      ...completed,
      questions: evaluatedQuestions,
      diagnosticSummary,
    };
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

  static async getQuestionById(questionId: string) {
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: { session: true },
    });

    if (!question) {
      throw ApiError.notFound('Interview question not found.');
    }

    return question;
  }

  static async submitAudioAnswerUpdate(dto: {
    sessionId: string;
    questionId: string;
    userAnswer: string;
    evaluation: any;
    audioUrl: string;
  }) {
    // Update Question with user answer, audio URL, and AI feedback
    const updatedQuestion = await prisma.interviewQuestion.update({
      where: { id: dto.questionId },
      data: {
        userAnswer: dto.userAnswer,
        audioUrl: dto.audioUrl,
        score: dto.evaluation.score,
        aiFeedback: JSON.stringify(dto.evaluation),
      },
    });

    return {
      question: updatedQuestion,
      evaluation: dto.evaluation,
    };
  }
}
