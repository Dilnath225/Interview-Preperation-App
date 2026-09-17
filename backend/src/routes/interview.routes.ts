import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/start', asyncHandler(InterviewController.start));
router.post('/answer', asyncHandler(InterviewController.submitAnswer));
router.post('/:id/complete', asyncHandler(InterviewController.complete));
router.get('/', asyncHandler(InterviewController.getAll));
router.get('/:id', asyncHandler(InterviewController.getById));

export default router;
