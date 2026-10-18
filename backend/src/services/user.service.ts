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

    const [
      interviewsCount,
      completedInterviewsList,
      acceptedSubmissions,
      completedAssessments,
      resumesList,
    ] = await Promise.all([
      prisma.interviewSession.count({ where: { userId } }),
      prisma.interviewSession.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { overallScore: true },
      }),
      prisma.codingSubmission.findMany({
        where: { userId, status: 'ACCEPTED' },
        select: { score: true },
      }),
      prisma.technicalAssessment.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { totalScore: true },
      }),
      prisma.resumeDiagnostic.findMany({
        where: { userId },
        select: { overallScore: true, atsScore: true },
      }),
    ]);

    const completedInterviewsCount = completedInterviewsList.length;
    const solvedChallengesCount = acceptedSubmissions.length;
    const completedAssessmentsCount = completedAssessments.length;
    const resumesCount = resumesList.length;

    // Total activity count
    const totalActivities =
      completedInterviewsCount + solvedChallengesCount + completedAssessmentsCount + resumesCount;

    let computedReadiness = 0;
    let readinessLevel = 'NOT_STARTED';
    let readinessVerdict = 'Take your first interview, coding challenge, or leadership drill to calculate your readiness.';

    if (totalActivities > 0) {
      let weightedSum = 0;
      let totalWeight = 0;

      // 1. Mock Interviews (Weight 40%)
      if (completedInterviewsCount > 0) {
        const interviewAvg =
          completedInterviewsList.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) /
          completedInterviewsCount;
        weightedSum += interviewAvg * 0.4;
        totalWeight += 0.4;
      }

      // 2. Technical & Coding (Weight 40%)
      if (solvedChallengesCount > 0 || completedAssessmentsCount > 0) {
        let codingAvg = 0;
        if (completedAssessmentsCount > 0) {
          codingAvg =
            completedAssessments.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) /
            completedAssessmentsCount;
        } else {
          // Solved individual challenges scale
          codingAvg = Math.min(100, solvedChallengesCount * 25);
        }
        weightedSum += codingAvg * 0.4;
        totalWeight += 0.4;
      }

      // 3. Resume ATS Diagnostic (Weight 20%)
      if (resumesCount > 0) {
        const resumeAvg =
          resumesList.reduce((acc, curr) => acc + (curr.overallScore || curr.atsScore || 0), 0) /
          resumesCount;
        weightedSum += resumeAvg * 0.2;
        totalWeight += 0.2;
      }

      const rawAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
      // Activity breadth factor (encourage practicing across multiple areas)
      const breadthMultiplier = Math.min(1.0, 0.65 + totalActivities * 0.07);
      computedReadiness = Math.round(Math.min(100, Math.max(0, rawAverage * breadthMultiplier)));

      if (computedReadiness >= 90) {
        readinessLevel = 'ENTERPRISE_READY';
        readinessVerdict = 'Enterprise Ready (Top 5%) - Exceptional readiness for senior and tier-1 companies.';
      } else if (computedReadiness >= 75) {
        readinessLevel = 'JOB_READY';
        readinessVerdict = 'Job Ready - Strong performance across technical problem-solving and interviews.';
      } else if (computedReadiness >= 50) {
        readinessLevel = 'IMPROVING';
        readinessVerdict = 'Making Steady Progress - Good fundamentals. Keep drilling behavioral and code challenges.';
      } else {
        readinessLevel = 'NEEDS_PRACTICE';
        readinessVerdict = 'Needs Practice - Complete more mock sessions and coding challenges to boost readiness.';
      }
    }

    // Persist computed readiness in background if changed
    if (user.readinessScore !== computedReadiness) {
      prisma.user
        .update({
          where: { id: userId },
          data: { readinessScore: computedReadiness },
        })
        .catch((e) => console.warn('Failed to update readiness score cache:', e.message));
    }

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
      user: {
        ...user,
        readinessScore: computedReadiness,
      },
      stats: {
        totalInterviews: interviewsCount,
        completedInterviews: completedInterviewsCount,
        solvedChallenges: solvedChallengesCount,
        uploadedResumes: resumesCount,
        readinessScore: computedReadiness,
        readinessLevel,
        readinessVerdict,
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
