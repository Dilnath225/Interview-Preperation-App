import { Request, Response } from 'express';
import { JobService } from '../services/job.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class JobController {
  // ─────────────────────────────────────────────────────────
  // COMPANY-SIDE (requires company auth)
  // ─────────────────────────────────────────────────────────

  /**
   * Creates a new job posting for the authenticated company
   */
  static createJob = async (req: Request, res: Response) => {
    const companyId = (req as any).company.id;
    const { title, description } = req.body;

    if (!title || !description) {
      throw ApiError.badRequest('Title and description are required.');
    }

    const job = await JobService.createJob(companyId, req.body);
    return sendResponse(res, 201, { job }, 'Job posting created successfully.');
  };

  /**
   * Lists all job postings for the authenticated company
   */
  static getMyJobs = async (req: Request, res: Response) => {
    const companyId = (req as any).company.id;
    const status = req.query.status as string | undefined;

    const jobs = await JobService.getCompanyJobs(companyId, status);
    return sendResponse(res, 200, { jobs }, 'Company jobs retrieved successfully.');
  };

  /**
   * Updates a job posting owned by the authenticated company
   */
  static updateJob = async (req: Request, res: Response) => {
    const companyId = (req as any).company.id;
    const rawId = req.params.id;
    const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

    const job = await JobService.updateJob(companyId, jobId, req.body);
    return sendResponse(res, 200, { job }, 'Job posting updated successfully.');
  };

  /**
   * Soft deletes a job posting by setting status to CLOSED
   */
  static deleteJob = async (req: Request, res: Response) => {
    const companyId = (req as any).company.id;
    const rawId = req.params.id;
    const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

    const job = await JobService.deleteJob(companyId, jobId);
    return sendResponse(res, 200, { job }, 'Job posting closed successfully.');
  };

  /**
   * Returns aggregate job stats for the authenticated company
   */
  static getJobStats = async (req: Request, res: Response) => {
    const companyId = (req as any).company.id;

    const stats = await JobService.getJobStats(companyId);
    return sendResponse(res, 200, { stats }, 'Job statistics retrieved successfully.');
  };

  // ─────────────────────────────────────────────────────────
  // PUBLIC-SIDE (no auth needed)
  // ─────────────────────────────────────────────────────────

  /**
   * Lists all active, non-expired public job postings with optional filters
   */
  static getPublicJobs = async (req: Request, res: Response) => {
    const filters = {
      targetRole: req.query.targetRole as string | undefined,
      type: req.query.type as string | undefined,
      experience: req.query.experience as string | undefined,
      location: req.query.location as string | undefined,
    };

    const jobs = await JobService.getPublicJobs(filters);
    return sendResponse(res, 200, { jobs }, 'Public jobs retrieved successfully.');
  };

  /**
   * Retrieves a single job posting by ID with full company details
   */
  static getPublicJobById = async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

    const job = await JobService.getJobById(jobId);
    return sendResponse(res, 200, { job }, 'Job details retrieved successfully.');
  };

  // ─────────────────────────────────────────────────────────
  // APPLICATIONS PIPELINE
  // ─────────────────────────────────────────────────────────

  /**
   * Candidate applies to an active job posting
   */
  static applyToJob = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Candidate authentication required.');
    }

    const rawId = req.params.id;
    const jobId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { fullName, email, phone, coverLetter, resumeUrl } = req.body;

    if (!fullName || !email) {
      throw ApiError.badRequest('Full Name and Email are required.');
    }

    const application = await JobService.applyToJob(userId, jobId, {
      fullName,
      email,
      phone,
      coverLetter,
      resumeUrl,
    });

    return sendResponse(res, 201, { application }, 'Application submitted successfully.');
  };

  /**
   * Candidate retrieves all their submitted applications
   */
  static getMyApplications = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Candidate authentication required.');
    }

    const applications = await JobService.getCandidateApplications(userId);
    return sendResponse(res, 200, { applications }, 'Candidate applications retrieved.');
  };

  /**
   * Company retrieves applications for a specific job
   */
  static getJobApplications = async (req: Request, res: Response) => {
    const companyId = (req as any).company?.id;
    if (!companyId) {
      throw ApiError.unauthorized('Company authentication required.');
    }

    const rawId = req.params.id;
    const jobId = Array.isArray(rawId) ? rawId[0] : rawId;

    const applications = await JobService.getJobApplications(companyId, jobId);
    return sendResponse(res, 200, { applications }, 'Job applications retrieved.');
  };

  /**
   * Company retrieves all candidate applications across all its jobs
   */
  static getAllCompanyApplications = async (req: Request, res: Response) => {
    const companyId = (req as any).company?.id;
    if (!companyId) {
      throw ApiError.unauthorized('Company authentication required.');
    }

    const applications = await JobService.getAllCompanyApplications(companyId);
    return sendResponse(res, 200, { applications }, 'All company applications retrieved.');
  };

  /**
   * Company updates the status of an application
   */
  static updateApplicationStatus = async (req: Request, res: Response) => {
    const companyId = (req as any).company?.id;
    if (!companyId) {
      throw ApiError.unauthorized('Company authentication required.');
    }

    const rawAppId = req.params.applicationId;
    const applicationId = Array.isArray(rawAppId) ? rawAppId[0] : rawAppId;
    const { status } = req.body;

    if (!status) {
      throw ApiError.badRequest('Application status is required.');
    }

    const updated = await JobService.updateApplicationStatus(companyId, applicationId, status);
    return sendResponse(res, 200, { application: updated }, 'Application status updated.');
  };
}
