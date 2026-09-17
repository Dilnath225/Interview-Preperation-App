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
}
