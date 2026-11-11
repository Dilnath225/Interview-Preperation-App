import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';

export interface CreateJobDTO {
  title: string;
  description: string;
  targetRole?: string;
  location?: string;
  salaryRange?: string;
  requirements?: string; // JSON array string
  type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experience?: 'Internship' | 'Junior' | 'Mid-Level' | 'Senior' | 'Lead';
  expiresAt?: Date;
}

export interface UpdateJobDTO extends Partial<CreateJobDTO> {
  status?: 'ACTIVE' | 'CLOSED' | 'DRAFT';
}

export interface JobFilters {
  targetRole?: string;
  type?: string;
  experience?: string;
  location?: string;
}

export class JobService {
  /**
   * Creates a new job posting for a company
   */
  static async createJob(companyId: string, dto: CreateJobDTO) {
    const job = await prisma.jobPosting.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        targetRole: dto.targetRole || 'Software Engineer',
        location: dto.location || 'Remote',
        salaryRange: dto.salaryRange,
        requirements: dto.requirements,
        type: dto.type || 'FULL_TIME',
        experience: dto.experience || 'Junior',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            location: true,
            website: true,
          },
        },
      },
    });

    return job;
  }

  /**
   * Lists all job postings for a company, optionally filtered by status
   */
  static async getCompanyJobs(companyId: string, status?: string) {
    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    return jobs;
  }

  /**
   * Updates a job posting, verifying it belongs to the company
   */
  static async updateJob(companyId: string, jobId: string, dto: UpdateJobDTO) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw ApiError.notFound('Job posting not found.');
    }

    if (job.companyId !== companyId) {
      throw ApiError.forbidden('You do not have permission to update this job posting.');
    }

    const updated = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetRole !== undefined && { targetRole: dto.targetRole }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.salaryRange !== undefined && { salaryRange: dto.salaryRange }),
        ...(dto.requirements !== undefined && { requirements: dto.requirements }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.experience !== undefined && { experience: dto.experience }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            location: true,
            website: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Soft deletes a job posting by setting its status to CLOSED
   */
  static async deleteJob(companyId: string, jobId: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw ApiError.notFound('Job posting not found.');
    }

    if (job.companyId !== companyId) {
      throw ApiError.forbidden('You do not have permission to delete this job posting.');
    }

    const closed = await prisma.jobPosting.update({
      where: { id: jobId },
      data: { status: 'CLOSED' },
    });

    return closed;
  }

  /**
   * Queries all ACTIVE job postings that haven't expired, with optional filters
   */
  static async getPublicJobs(filters?: JobFilters) {
    const where: any = {
      status: 'ACTIVE',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (filters?.targetRole) {
      where.targetRole = {
        contains: filters.targetRole,
        mode: 'insensitive',
      };
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.experience) {
      where.experience = filters.experience;
    }

    if (filters?.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            location: true,
            website: true,
          },
        },
      },
    });

    return jobs;
  }

  /**
   * Retrieves a single job posting with full company details
   */
  static async getJobById(jobId: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            location: true,
            website: true,
            description: true,
            size: true,
          },
        },
      },
    });

    if (!job) {
      throw ApiError.notFound('Job posting not found.');
    }

    return job;
  }

  /**
   * Returns aggregate counts of job postings for a company
   */
  static async getJobStats(companyId: string) {
    const [totalJobs, activeJobs, closedJobs, draftJobs] = await Promise.all([
      prisma.jobPosting.count({ where: { companyId } }),
      prisma.jobPosting.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.jobPosting.count({ where: { companyId, status: 'CLOSED' } }),
      prisma.jobPosting.count({ where: { companyId, status: 'DRAFT' } }),
    ]);

    return { totalJobs, activeJobs, closedJobs, draftJobs };
  }

  // ─────────────────────────────────────────────────────────
  // JOB APPLICATION PIPELINE
  // ─────────────────────────────────────────────────────────

  /**
   * Finds existing candidate user by email or creates a new candidate record
   */
  static async findOrCreateApplicant(email: string, name: string) {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (existing) {
      return existing;
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: 'APPLICANT_EXTERNAL_REGISTRATION',
        targetRole: 'Software Engineer',
      },
      select: { id: true, email: true, name: true },
    });

    return newUser;
  }

  /**
   * Candidate submits an application for a specific job
   */
  static async applyToJob(userId: string, jobId: string, dto: {
    fullName: string;
    email: string;
    phone?: string;
    coverLetter?: string;
    resumeUrl?: string;
  }) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, title: true, company: { select: { name: true } } },
    });

    if (!job) {
      throw ApiError.notFound('Job posting not found.');
    }

    if (job.status !== 'ACTIVE') {
      throw ApiError.badRequest('This job posting is no longer accepting applications.');
    }

    // Check if user already applied
    const existingApp = await prisma.jobApplication.findFirst({
      where: { jobId, userId },
    });

    if (existingApp) {
      throw ApiError.badRequest('You have already applied for this position.');
    }

    // Retrieve user readiness & certification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        readinessScore: true,
        certificates: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        coverLetter: dto.coverLetter?.trim() || null,
        resumeUrl: dto.resumeUrl?.trim() || null,
        readinessScore: user?.readinessScore || 0,
        hasCertificate: Boolean(user?.certificates && user.certificates.length > 0),
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            targetRole: true,
            location: true,
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });

    return application;
  }

  /**
   * Retrieves all applications submitted by a specific candidate
   */
  static async getCandidateApplications(userId: string) {
    return prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            targetRole: true,
            location: true,
            salaryRange: true,
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });
  }

  /**
   * Retrieves applications for a specific company job
   */
  static async getJobApplications(companyId: string, jobId: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { companyId: true },
    });

    if (!job) {
      throw ApiError.notFound('Job posting not found.');
    }

    if (job.companyId !== companyId) {
      throw ApiError.forbidden('You do not have permission to view applications for this job.');
    }

    return prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: [
        { readinessScore: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            avatarUrl: true,
            targetRole: true,
            skills: true,
            experienceLevel: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves all candidate applications across all jobs for a company
   */
  static async getAllCompanyApplications(companyId: string) {
    return prisma.jobApplication.findMany({
      where: {
        job: { companyId },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      include: {
        job: {
          select: {
            id: true,
            title: true,
            targetRole: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            avatarUrl: true,
            skills: true,
            experienceLevel: true,
          },
        },
      },
    });
  }

  /**
   * Updates application review status (SHORTLISTED, REJECTED, REVIEWING, ACCEPTED)
   */
  static async updateApplicationStatus(companyId: string, applicationId: string, status: string) {
    const app = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: { select: { companyId: true } } },
    });

    if (!app) {
      throw ApiError.notFound('Job application not found.');
    }

    if (app.job.companyId !== companyId) {
      throw ApiError.forbidden('You do not have permission to update this application.');
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: status.toUpperCase() },
    });

    return updated;
  }
}
