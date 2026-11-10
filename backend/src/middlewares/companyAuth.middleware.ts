import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';
import { prisma } from '../config/prisma';

export interface CompanyAuthRequest extends Request {
  company?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateCompany = async (
  req: CompanyAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Invalid authorization format.');
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;

    if (!decoded?.companyId || decoded?.role !== 'company') {
      throw ApiError.unauthorized('Invalid company authorization token.');
    }

    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!company) {
      throw ApiError.unauthorized('Company associated with this token no longer exists.');
    }

    req.company = company;
    next();
  } catch (error) {
    next(error);
  }
};
