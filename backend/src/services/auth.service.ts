import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';

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
  static async register(dto: RegisterDTO) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw ApiError.badRequest('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        targetRole: dto.targetRole || 'Full Stack Developer',
      },
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

    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  static async login(dto: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
        readinessScore: user.readinessScore,
        skills: user.skills,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static generateToken(userId: string, email: string): string {
    return jwt.sign({ id: userId, email }, ENV.JWT_SECRET as jwt.Secret, {
      expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as any,
    });
  }

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
        },
      });
      console.log('✅ Demo user seeded (email: demo@aimentor.com / pass: password123)');
    }
  }
}
