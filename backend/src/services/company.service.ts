import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface RegisterCompanyDTO {
  name: string;
  email: string;
  password: string;
  website?: string;
  industry?: string;
  description?: string;
  size?: string;
  location?: string;
}

export interface LoginCompanyDTO {
  email: string;
  password: string;
}

export class CompanyService {
  /**
   * Registers a new company account
   */
  static async register(dto: RegisterCompanyDTO) {
    const email = dto.email.toLowerCase().trim();
    const existing = await prisma.company.findUnique({
      where: { email },
    });

    if (existing) {
      throw ApiError.badRequest('A company with this email already exists. Please sign in.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const company = await prisma.company.create({
      data: {
        name: dto.name.trim(),
        email,
        password: hashedPassword,
        website: dto.website?.trim() || null,
        industry: dto.industry?.trim() || 'Technology',
        description: dto.description?.trim() || null,
        size: dto.size?.trim() || '50-200',
        location: dto.location?.trim() || null,
      },
    });

    const token = this.generateToken(company.id, company.email);

    return {
      company: this.sanitizeCompany(company),
      token,
      message: 'Company registered successfully.',
    };
  }

  /**
   * Signs in a company with email & password
   */
  static async login(dto: LoginCompanyDTO) {
    const email = dto.email.toLowerCase().trim();
    const company = await prisma.company.findUnique({
      where: { email },
    });

    if (!company) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, company.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = this.generateToken(company.id, company.email);

    return {
      company: this.sanitizeCompany(company),
      token,
      message: 'Login successful.',
    };
  }

  /**
   * Returns the company profile with job posting count
   */
  static async getProfile(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: { jobPostings: true },
        },
      },
    });

    if (!company) {
      throw ApiError.notFound('Company not found.');
    }

    return {
      ...this.sanitizeCompany(company),
      jobCount: company._count.jobPostings,
    };
  }

  /**
   * Updates allowed company profile fields
   */
  static async updateProfile(companyId: string, dto: Partial<Omit<RegisterCompanyDTO, 'email' | 'password'>> & { logoUrl?: string }) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw ApiError.notFound('Company not found.');
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.website !== undefined) updateData.website = dto.website.trim() || null;
    if (dto.industry !== undefined) updateData.industry = dto.industry.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim() || null;
    if (dto.size !== undefined) updateData.size = dto.size.trim();
    if (dto.location !== undefined) updateData.location = dto.location.trim() || null;
    if (dto.logoUrl !== undefined) updateData.logoUrl = dto.logoUrl;

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    return {
      company: this.sanitizeCompany(updated),
      message: 'Profile updated successfully.',
    };
  }

  /**
   * Generates a signed JWT access token for a company
   */
  static generateToken(companyId: string, email: string): string {
    return jwt.sign(
      { companyId, email, role: 'company' },
      ENV.JWT_SECRET as jwt.Secret,
      { expiresIn: '30d' as any }
    );
  }

  /**
   * Sanitizes company object by stripping sensitive fields
   */
  static sanitizeCompany(company: any) {
    return {
      id: company.id,
      name: company.name,
      email: company.email,
      logoUrl: company.logoUrl,
      website: company.website,
      industry: company.industry,
      description: company.description,
      size: company.size,
      location: company.location,
      isVerified: company.isVerified,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
