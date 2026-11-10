import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';

interface BrowseTalentFilters {
  targetRole?: string;
  minScore?: number;
  experienceLevel?: string;
}

export class TalentService {
  /**
   * Browse verified candidates with readinessScore > 0, ordered by score DESC.
   * Recruiters see a sanitized profile plus key stats.
   */
  static async browseTalent(filters?: BrowseTalentFilters) {
    const where: any = {
      isVerified: true,
      readinessScore: { gt: 0 },
    };

    if (filters?.targetRole) {
      where.targetRole = { contains: filters.targetRole, mode: 'insensitive' };
    }
    if (filters?.minScore !== undefined) {
      where.readinessScore = { gte: filters.minScore };
    }
    if (filters?.experienceLevel) {
      where.experienceLevel = { equals: filters.experienceLevel, mode: 'insensitive' };
    }

    const candidates = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        targetRole: true,
        readinessScore: true,
        skills: true,
        experienceLevel: true,
        education: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            interviews: {
              where: { status: 'COMPLETED' },
            },
            submissions: {
              where: { status: 'ACCEPTED' },
            },
            certificates: true,
          },
        },
      },
      orderBy: { readinessScore: 'desc' },
    });

    return candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      targetRole: candidate.targetRole,
      readinessScore: candidate.readinessScore,
      skills: candidate.skills,
      experienceLevel: candidate.experienceLevel,
      education: candidate.education,
      bio: candidate.bio,
      avatarUrl: candidate.avatarUrl,
      createdAt: candidate.createdAt,
      stats: {
        completedInterviews: candidate._count.interviews,
        solvedChallenges: candidate._count.submissions,
        certificateCount: candidate._count.certificates,
        hasCertificate: candidate._count.certificates > 0,
      },
    }));
  }

  /**
   * Full candidate profile with detailed stats for recruiter deep-dive view.
   */
  static async getCandidateProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        targetRole: true,
        readinessScore: true,
        skills: true,
        experienceLevel: true,
        education: true,
        bio: true,
        avatarUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('Candidate not found.');
    }

    // Gather detailed stats in parallel
    const [
      interviewStats,
      codingStats,
      assessmentStats,
      resumeStats,
      certificates,
    ] = await Promise.all([
      // Interview sessions: count + avg score
      prisma.interviewSession.aggregate({
        where: { userId, status: 'COMPLETED' },
        _count: { id: true },
        _avg: { overallScore: true },
      }),

      // Coding submissions: total count + accepted count
      prisma.codingSubmission.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),

      // Technical assessments: count + avg score
      prisma.technicalAssessment.aggregate({
        where: { userId, status: 'COMPLETED' },
        _count: { id: true },
        _avg: { totalScore: true },
      }),

      // Resume diagnostics: count + avg ATS score
      prisma.resumeDiagnostic.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { atsScore: true },
      }),

      // Certificates issued
      prisma.certificate.findMany({
        where: { userId, status: 'ACTIVE' },
        select: {
          id: true,
          credentialId: true,
          candidateName: true,
          targetRole: true,
          score: true,
          pdfUrl: true,
          issueDate: true,
        },
        orderBy: { issueDate: 'desc' },
      }),
    ]);

    // Parse coding stats
    const totalSubmissions = codingStats.reduce((sum, g) => sum + g._count.id, 0);
    const acceptedSubmissions = codingStats.find((g) => g.status === 'ACCEPTED')?._count.id || 0;

    return {
      profile: user,
      stats: {
        interviews: {
          count: interviewStats._count.id,
          avgScore: interviewStats._avg.overallScore
            ? Math.round(interviewStats._avg.overallScore)
            : null,
        },
        coding: {
          totalSubmissions,
          acceptedSubmissions,
        },
        assessments: {
          count: assessmentStats._count.id,
          avgScore: assessmentStats._avg.totalScore
            ? Math.round(assessmentStats._avg.totalScore)
            : null,
        },
        resume: {
          count: resumeStats._count.id,
          avgAtsScore: resumeStats._avg.atsScore
            ? Math.round(resumeStats._avg.atsScore)
            : null,
        },
        certificates,
        readinessScore: user.readinessScore,
      },
    };
  }

  /**
   * Verify a candidate credential by looking up a certificate's credentialId.
   * Returns the certificate + basic candidate info, or throws 404.
   */
  static async verifyCandidateCredential(credentialId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { credentialId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            targetRole: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!certificate) {
      throw ApiError.notFound('Credential not found. The credential ID may be invalid or the certificate has been revoked.');
    }

    return {
      certificate: {
        id: certificate.id,
        credentialId: certificate.credentialId,
        candidateName: certificate.candidateName,
        targetRole: certificate.targetRole,
        score: certificate.score,
        pdfUrl: certificate.pdfUrl,
        issueDate: certificate.issueDate,
        status: certificate.status,
      },
      candidate: certificate.user,
    };
  }
}
