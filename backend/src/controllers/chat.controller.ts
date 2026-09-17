import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ChatService } from '../services/chat.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class ChatController {
  static sendMessage = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      throw ApiError.badRequest('Message is required.');
    }

    const aiMessage = await ChatService.sendMessage(req.user.id, message, context);
    return sendResponse(res, 200, { message: aiMessage }, 'AI response generated');
  };

  static getHistory = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const history = await ChatService.getChatHistory(req.user.id);
    return sendResponse(res, 200, { history }, 'Chat history retrieved');
  };
}
