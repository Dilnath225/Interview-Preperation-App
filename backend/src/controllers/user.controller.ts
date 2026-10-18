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

  static uploadAvatar = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest('No image file uploaded.');

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await UserService.updateAvatar(req.user.id, avatarUrl);

    return sendResponse(res, 200, { avatarUrl: user.avatarUrl }, 'Profile picture updated successfully');
  };

  static changePassword = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw ApiError.badRequest('Both current password and new password are required.');
    }

    const result = await UserService.changePassword(req.user.id, oldPassword, newPassword);
    return sendResponse(res, 200, result, 'Password changed successfully');
  };

  static deleteAccount = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await UserService.deleteAccount(req.user.id);
    return sendResponse(res, 200, result, 'Account deleted successfully');
  };
}
