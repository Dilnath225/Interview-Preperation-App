import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';

export interface UpdateProfileDTO {
  name?: string;
  targetRole?: string;
  skills?: string;
  avatarUrl?: string;
}

export class UserService {
  static async getProfileWithStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        targetRole: true,
        readinessScore: true,
        skills: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const [interviewsCount, completedInterviews, codingSubmissions, resumesCount] =
      await Promise.all([
        prisma.interviewSession.count({ where: { userId } }),
        prisma.interviewSession.count({
          where: { userId, status: 'COMPLETED' },
        }),
        prisma.codingSubmission.count({
          where: { userId, status: 'ACCEPTED' },
        }),
        prisma.resumeDiagnostic.count({ where: { userId } }),
      ]);

    const recentInterviews = await prisma.interviewSession.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        role: true,
        difficulty: true,
        overallScore: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      user,
      stats: {
        totalInterviews: interviewsCount,
        completedInterviews,
        solvedChallenges: codingSubmissions,
        uploadedResumes: resumesCount,
        readinessScore: user.readinessScore || 65,
      },
      recentInterviews,
    };
  }

  static async updateProfile(userId: string, dto: UpdateProfileDTO) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.targetRole && { targetRole: dto.targetRole.trim() }),
        ...(dto.skills && { skills: dto.skills.trim() }),
        ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        targetRole: true,
        readinessScore: true,
        skills: true,
        avatarUrl: true,
      },
    });

    return user;
  }
}
