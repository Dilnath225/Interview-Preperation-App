import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

export class AuthController {
  static register = async (req: Request, res: Response) => {
    const { name, email, password, targetRole } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email, and password are required.');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters.');
    }

    const result = await AuthService.register({ name, email, password, targetRole });
    return sendResponse(res, 201, result, 'Registration successful');
  };

  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }

    const result = await AuthService.login({ email, password });
    return sendResponse(res, 200, result, 'Login successful');
  };

  static me = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    return sendResponse(res, 200, { user }, 'User profile retrieved');
  };
}
