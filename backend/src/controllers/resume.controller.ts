import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ResumeService } from '../services/resume.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class ResumeController {
  static analyze = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest('No resume file uploaded.');

    const result = await ResumeService.analyzeResume(req.user.id, req.file);
    return sendResponse(res, 200, result, 'Resume ATS analysis completed');
  };

  static getHistory = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const resumes = await ResumeService.getUserResumes(req.user.id);
    return sendResponse(res, 200, { resumes }, 'Resume analysis history');
  };
}
