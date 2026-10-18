import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';
import { EmailService } from './email.service';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  targetRole?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Registers a new user and dispatches a 6-digit OTP to their email.
   * Account remains unverified until verifyOtp is invoked.
   */
  static async register(dto: RegisterDTO) {
    const email = dto.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing && existing.isVerified) {
      throw ApiError.badRequest('An account with this email already exists. Please sign in.');
    }

    const otpCode = EmailService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    if (existing && !existing.isVerified) {
      // User registered previously but never completed OTP verification — refresh details
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: dto.name.trim(),
          password: hashedPassword,
          targetRole: dto.targetRole || 'Full Stack Developer',
          otpCode,
          otpExpiresAt,
        },
      });
    } else {
      // Brand new registration
      await prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          password: hashedPassword,
          targetRole: dto.targetRole || 'Full Stack Developer',
          isVerified: false,
          otpCode,
          otpExpiresAt,
        },
      });
    }

    // Dispatch verification email
    await EmailService.sendOtpEmail(email, dto.name.trim(), otpCode);

    return {
      requireOtp: true,
      email,
      message: 'Verification code sent to your email. Please confirm to complete registration.',
    };
  }

  /**
   * Verifies the 6-digit OTP code sent to the user's email and issues a JWT token
   */
  static async verifyOtp(emailInput: string, otp: string) {
    const email = emailInput.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('Account not found with this email address.');
    }

    if (user.isVerified) {
      const token = this.generateToken(user.id, user.email);
      return {
        user: this.sanitizeUser(user),
        token,
        message: 'Account is already verified.',
      };
    }

    if (!user.otpCode || user.otpCode !== otp.trim()) {
      throw ApiError.badRequest('Invalid verification code. Please check and try again.');
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw ApiError.badRequest('Verification code has expired. Please tap "Resend Code" to request a new one.');
    }

    // Mark as verified & clear OTP
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    const token = this.generateToken(updated.id, updated.email);

    return {
      user: this.sanitizeUser(updated),
      token,
      message: 'Email verified successfully! Welcome to AI Mentor.',
    };
  }

  /**
   * Resends a fresh 6-digit OTP code to the user's email
   */
  static async resendOtp(emailInput: string) {
    const email = emailInput.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('Account not found.');
    }

    if (user.isVerified) {
      throw ApiError.badRequest('This account is already verified. You can sign in directly.');
    }

    const otpCode = EmailService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    await EmailService.sendOtpEmail(email, user.name, otpCode);

    return {
      success: true,
      email,
      message: 'A new 6-digit verification code has been sent to your email.',
    };
  }

  /**
   * Signs in user with email & password. Requires email to be verified.
   */
  static async login(dto: LoginDTO) {
    const email = dto.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // If user has not yet verified their email, send a fresh OTP and prompt them
    if (!user.isVerified) {
      const otpCode = EmailService.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });

      await EmailService.sendOtpEmail(email, user.name, otpCode);

      return {
        requireOtp: true,
        email: user.email,
        message: 'Please verify your email before signing in. A fresh 6-digit verification code has been sent to your email.',
      };
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
      message: 'Login successful',
    };
  }

  /**
   * Generates a signed JWT access token
   */
  static generateToken(userId: string, email: string): string {
    return jwt.sign({ id: userId, email }, ENV.JWT_SECRET as jwt.Secret, {
      expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as any,
    });
  }

  /**
   * Sanitizes user object by stripping sensitive fields
   */
  private static sanitizeUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      targetRole: user.targetRole,
      readinessScore: user.readinessScore,
      skills: user.skills,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      phone: user.phone,
      experienceLevel: user.experienceLevel,
      education: user.education,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  /**
   * Seeds demo account for development/testing
   */
  static async seedDemoUser() {
    const existing = await prisma.user.findUnique({
      where: { email: 'demo@aimentor.com' },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          name: 'Shanu Fernando',
          email: 'demo@aimentor.com',
          password: hashedPassword,
          targetRole: 'Full Stack Developer',
          readinessScore: 84,
          skills: 'React Native, TypeScript, Node.js, Express, Python, SQL',
          isVerified: true,
          bio: 'Passionate full-stack developer preparing for senior engineering roles.',
          experienceLevel: 'Mid-Level',
        },
      });
      console.log('✅ Demo user seeded (email: demo@aimentor.com / pass: password123)');
    }
  }
}
