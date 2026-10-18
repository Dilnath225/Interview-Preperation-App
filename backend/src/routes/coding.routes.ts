import { Router } from 'express';
import { CodingController } from '../controllers/coding.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Challenge bank
router.get('/', asyncHandler(CodingController.getAll));
router.get('/:slug', asyncHandler(CodingController.getBySlug));

// Interactive Code Testing
router.post('/run-sample', authenticate, asyncHandler(CodingController.runSample));
router.post('/run-all', authenticate, asyncHandler(CodingController.runAll));

// 5-Question Technical Assessment Flow
router.post('/assessment/start', authenticate, asyncHandler(CodingController.startAssessment));
router.post('/assessment/submit', authenticate, asyncHandler(CodingController.submitAssessment));
router.get('/assessment/:id', authenticate, asyncHandler(CodingController.getAssessment));

// Single submission (legacy)
router.post('/submit', authenticate, asyncHandler(CodingController.submit));

export default router;
