import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

import { uploadAudio } from '../middlewares/upload.middleware';

const router = Router();

// Public proctoring gaze detection endpoint (used by mobile/web during video stream)
router.post('/gaze-detection', asyncHandler(InterviewController.detectGaze));

router.use(authenticate);

router.post('/start', asyncHandler(InterviewController.start));
router.post(
  '/speech-analysis',
  uploadAudio.single('audio'),
  asyncHandler(InterviewController.analyzeSpeech)
);
router.post('/answer', asyncHandler(InterviewController.submitAnswer));
router.post(
  '/:sessionId/questions/:questionId/answer-audio',
  uploadAudio.single('audio'),
  asyncHandler(InterviewController.submitAudioAnswer)
);
router.post(
  '/transcribe',
  uploadAudio.single('audio'),
  asyncHandler(InterviewController.transcribeAudio)
);
router.post('/:id/complete', asyncHandler(InterviewController.complete));
router.get('/', asyncHandler(InterviewController.getAll));
router.get('/:id', asyncHandler(InterviewController.getById));

export default router;
