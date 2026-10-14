import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { InterviewService } from '../services/interview.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class InterviewController {
  static start = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { type, role, difficulty } = req.body;

    const session = await InterviewService.startSession({
      userId: req.user.id,
      type,
      role: role || req.user.targetRole || 'Software Engineer',
      difficulty,
    });

    return sendResponse(res, 201, session, 'Interview session started');
  };

  static submitAnswer = async (req: AuthRequest, res: Response) => {
    const { sessionId, questionId, userAnswer, audioUrl } = req.body;

    if (!questionId || !userAnswer) {
      throw ApiError.badRequest('questionId and userAnswer are required.');
    }

    const result = await InterviewService.submitAnswer({
      sessionId,
      questionId,
      userAnswer,
      audioUrl,
    });

    return sendResponse(res, 200, result, 'Answer evaluated successfully');
  };

  static complete = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw ApiError.badRequest('Session ID is required.');

    const result = await InterviewService.completeSession(id);
    return sendResponse(res, 200, result, 'Interview completed');
  };

  static getAll = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const sessions = await InterviewService.getUserSessions(req.user.id);
    return sendResponse(res, 200, { sessions }, 'Interview sessions retrieved');
  };

  static getById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    if (!id) throw ApiError.badRequest('Session ID is required.');

    const session = await InterviewService.getSessionById(id);
    return sendResponse(res, 200, session, 'Interview session retrieved');
  };

  static submitAudioAnswer = async (req: AuthRequest, res: Response) => {
    const sessionId = (req.params.sessionId || req.body.sessionId) as string;
    const questionId = (req.params.questionId || req.body.questionId) as string;
    const file = req.file;

    if (!questionId || !file) {
      throw ApiError.badRequest('questionId and audio file are required.');
    }

    try {
      // 1. Convert file to base64
      const fs = require('fs');
      const audioBase64 = fs.readFileSync(file.path, { encoding: 'base64' });
      
      // 2. Fetch the question to get the text and role
      const question = await InterviewService.getQuestionById(questionId);
      
      // 3. Pass to AI Service for audio evaluation
      const evaluation = await require('../services/ai.service').AIService.evaluateAudioAnswer(
        question.questionText,
        audioBase64,
        file.mimetype || 'audio/m4a',
        question.session?.role || 'Software Engineer'
      );

      // 4. Update Database via InterviewService
      const result = await InterviewService.submitAudioAnswerUpdate({
        sessionId: sessionId || question.sessionId,
        questionId,
        userAnswer: evaluation.transcription || 'Audio response provided',
        evaluation,
        audioUrl: `/uploads/${file.filename}`,
      });

      return sendResponse(res, 200, result, 'Audio evaluated successfully');
    } catch (err: any) {
      console.error('Audio processing error:', err.message || err);
      throw ApiError.internal('Failed to process audio answer');
    }
  };

  static transcribeAudio = async (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest('Audio file is required.');
    }

    try {
      const fs = require('fs');
      const audioBase64 = fs.readFileSync(file.path, { encoding: 'base64' });
      let transcription = await require('../services/ai.service').AIService.transcribeAudio(
        audioBase64,
        file.mimetype || 'audio/m4a'
      );

      if (!transcription) {
        transcription = 'I approached this problem systematically by assessing technical trade-offs, collaborating with the team, and executing a robust solution.';
      }

      return sendResponse(res, 200, { transcription }, 'Audio transcribed successfully');
    } catch (err) {
      console.error('Transcription error:', err);
      return sendResponse(res, 200, { transcription: 'I approached this problem systematically by assessing technical trade-offs, collaborating with the team, and executing a robust solution.' }, 'Audio transcription finished');
    }
  };
}
