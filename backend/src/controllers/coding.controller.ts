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

  /**
   * Runs code against sample test cases (immediate feedback for "Run Code")
   */
  static runSample = async (req: AuthRequest, res: Response) => {
    const { challengeId, code, language } = req.body;
    if (!challengeId) throw ApiError.badRequest('challengeId is required.');

    const result = await CodingService.runSampleTests(challengeId, code || '', language || 'typescript');
    return sendResponse(res, 200, result, 'Sample test cases executed');
  };

  /**
   * Runs code against ALL test cases (sample + hidden) (for "Run All Tests")
   */
  static runAll = async (req: AuthRequest, res: Response) => {
    const { challengeId, code, language } = req.body;
    if (!challengeId) throw ApiError.badRequest('challengeId is required.');

    const result = await CodingService.runAllTests(challengeId, code || '', language || 'typescript');
    return sendResponse(res, 200, result, 'All test cases executed');
  };

  /**
   * Starts an Enterprise 5-question Technical Assessment
   */
  static startAssessment = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const count = typeof req.body.count === 'number' ? req.body.count : 5;
    const role = typeof req.body.role === 'string' ? req.body.role : 'Software Engineer';
    const level = typeof req.body.level === 'string' ? req.body.level : 'Junior';
    const language = typeof req.body.language === 'string' ? req.body.language : 'javascript';

    const assessment = await CodingService.startTechnicalAssessment(req.user.id, {
      count,
      role,
      level,
      language,
    });
    return sendResponse(res, 201, assessment, 'Technical assessment initiated');
  };

  /**
   * Submits full Technical Assessment answers and generates Enterprise AI Review
   */
  static submitAssessment = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { assessmentId, answers } = req.body;

    if (!assessmentId) throw ApiError.badRequest('assessmentId is required.');
    if (!Array.isArray(answers)) throw ApiError.badRequest('answers must be an array of question answers.');

    const review = await CodingService.submitTechnicalAssessment(req.user.id, assessmentId, answers);
    return sendResponse(res, 200, review, 'Technical assessment submitted and evaluated');
  };

  /**
   * Retrieves past assessment review
   */
  static getAssessment = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const assessmentId = req.params.id as string;
    if (!assessmentId) throw ApiError.badRequest('Assessment ID is required.');

    const assessment = await CodingService.getTechnicalAssessment(req.user.id, assessmentId);
    return sendResponse(res, 200, assessment, 'Assessment details retrieved');
  };

  /**
   * Legacy single-challenge submission method
   */
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
