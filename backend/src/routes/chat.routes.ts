import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/message', asyncHandler(ChatController.sendMessage));
router.get('/history', asyncHandler(ChatController.getHistory));

export default router;
