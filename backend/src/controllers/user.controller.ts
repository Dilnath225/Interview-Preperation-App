import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class UserController {
  static getProfile = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await UserService.getProfileWithStats(req.user.id);
    return sendResponse(res, 200, data, 'User profile retrieved');
  };

  static updateProfile = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await UserService.updateProfile(req.user.id, req.body);
    return sendResponse(res, 200, { user }, 'Profile updated successfully');
  };
}
