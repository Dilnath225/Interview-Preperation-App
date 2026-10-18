import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ChatService } from '../services/chat.service';
import { sendResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class ChatController {
  static sendMessage = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { message, context, attachment } = req.body;

    if ((!message || typeof message !== 'string') && !attachment) {
      throw ApiError.badRequest('Message or attachment is required.');
    }

    const effectiveMessage = (message && message.trim()) || (attachment?.name ? `Please examine this attached ${attachment.name}` : 'Hello');
    const aiMessage = await ChatService.sendMessage(req.user.id, effectiveMessage, context, attachment);
    return sendResponse(res, 200, { message: aiMessage }, 'AI response generated');
  };

  static getHistory = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const history = await ChatService.getChatHistory(req.user.id);
    return sendResponse(res, 200, { history }, 'Chat history retrieved');
  };
}
