import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { TalentService } from '../services/talent.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class CompanyController {
  /**
   * Register a new company account
   */
  static register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email, and password are required.');
    }

    const result = await CompanyService.register(req.body);
    return sendResponse(res, 201, result, 'Company registered successfully.');
  };

  /**
   * Log in to an existing company account
   */
  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }

    const result = await CompanyService.login({ email, password });
    return sendResponse(res, 200, result, 'Login successful.');
  };

  /**
   * Get current authenticated company profile
   */
  static getProfile = async (req: Request, res: Response) => {
    const companyId = (req as any).company?.id;
    if (!companyId) {
      throw ApiError.unauthorized('Company authentication required.');
    }

    const profile = await CompanyService.getProfile(companyId);
    return sendResponse(res, 200, { company: profile }, 'Company profile retrieved.');
  };

  /**
   * Update company profile details
   */
  static updateProfile = async (req: Request, res: Response) => {
    const companyId = (req as any).company?.id;
    if (!companyId) {
      throw ApiError.unauthorized('Company authentication required.');
    }

    const result = await CompanyService.updateProfile(companyId, req.body);
    return sendResponse(res, 200, result, 'Profile updated successfully.');
  };

  /**
   * Browse talent pool with filters (targetRole, minScore, experienceLevel)
   */
  static browseTalent = async (req: Request, res: Response) => {
    const filters = {
      targetRole: req.query.targetRole as string | undefined,
      minScore: req.query.minScore ? parseInt(req.query.minScore as string, 10) : undefined,
      experienceLevel: req.query.experienceLevel as string | undefined,
    };

    const talent = await TalentService.browseTalent(filters);
    return sendResponse(res, 200, { candidates: talent, total: talent.length }, 'Talent pool retrieved.');
  };

  /**
   * Get detailed candidate profile with coding, interview, assessment & cert stats
   */
  static getCandidateProfile = async (req: Request, res: Response) => {
    const rawId = req.params.userId;
    const userId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!userId) {
      throw ApiError.badRequest('Candidate User ID is required.');
    }

    const profile = await TalentService.getCandidateProfile(userId);
    return sendResponse(res, 200, { candidate: profile }, 'Candidate profile retrieved.');
  };

  /**
   * Recruiter verification of a candidate credential ID
   */
  static verifyCandidateCredential = async (req: Request, res: Response) => {
    const rawId = req.params.credentialId;
    const credentialId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!credentialId) {
      throw ApiError.badRequest('Credential ID is required.');
    }

    const result = await TalentService.verifyCandidateCredential(credentialId);
    return sendResponse(res, 200, { credential: result, verified: true }, 'Credential verified successfully.');
  };
}
