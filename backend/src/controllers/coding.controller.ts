import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CodingService } from '../services/coding.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class CodingController {
  static getAll = async (req: Request, res: Response) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;

    const challenges = await CodingService.getChallenges(category, difficulty);
    return sendResponse(res, 200, { challenges }, 'Coding challenges retrieved');
  };

  static getBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    if (!slug) throw ApiError.badRequest('Challenge slug is required.');

    const challenge = await CodingService.getChallengeBySlug(slug);
    return sendResponse(res, 200, challenge, 'Coding challenge details');
  };

  static submit = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { challengeId, code, language } = req.body;

    if (!challengeId || !code) {
      throw ApiError.badRequest('challengeId and code are required.');
    }

    const result = await CodingService.submitCode({
      userId: req.user.id,
      challengeId,
      code,
      language: language || 'typescript',
    });

    return sendResponse(res, 200, result, 'Code submitted and evaluated');
  };
}
