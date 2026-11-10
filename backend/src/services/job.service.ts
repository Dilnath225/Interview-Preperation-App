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
}
