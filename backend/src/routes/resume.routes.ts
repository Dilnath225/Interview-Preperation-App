import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadResume } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/analyze',
  uploadResume.single('resume'),
  asyncHandler(ResumeController.analyze)
);

router.get('/history', asyncHandler(ResumeController.getHistory));

export default router;
