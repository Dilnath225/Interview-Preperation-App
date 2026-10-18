import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';

export interface UpdateProfileDTO {
  name?: string;
  targetRole?: string;
  skills?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  experienceLevel?: string;
  education?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export class UserService {
  /**
   * Retrieves complete user profile with aggregated statistics
   */
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
        bio: true,
        phone: true,
        experienceLevel: true,
        education: true,
        githubUrl: true,
        linkedinUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
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

  /**
   * Updates user profile fields
   */
  static async updateProfile(userId: string, dto: UpdateProfileDTO) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.targetRole !== undefined && { targetRole: dto.targetRole.trim() }),
        ...(dto.skills !== undefined && { skills: dto.skills.trim() }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
        ...(dto.experienceLevel !== undefined && { experienceLevel: dto.experienceLevel.trim() }),
        ...(dto.education !== undefined && { education: dto.education.trim() }),
        ...(dto.githubUrl !== undefined && { githubUrl: dto.githubUrl.trim() }),
        ...(dto.linkedinUrl !== undefined && { linkedinUrl: dto.linkedinUrl.trim() }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        targetRole: true,
        readinessScore: true,
        skills: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        experienceLevel: true,
        education: true,
        githubUrl: true,
        linkedinUrl: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Updates user avatar URL
   */
  static async updateAvatar(userId: string, avatarUrl: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });
    return user;
  }

  /**
   * Changes user password after validating old password
   */
  static async changePassword(userId: string, oldPass: string, newPass: string) {
    if (newPass.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw ApiError.notFound('User not found.');

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password changed successfully.' };
  }

  /**
   * Deletes user account and associated cascading relations
   */
  static async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
    return { success: true, message: 'Account permanently deleted.' };
  }
}
