import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    targetRole?: string | null;
  };
}

export const authenticate = async (
  req: AuthRequest,
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
    const userId = decoded?.id || decoded?.userId;

    if (!userId) {
      throw ApiError.unauthorized('Invalid authorization token format.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        targetRole: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
