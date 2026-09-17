import { Router } from 'express';
import { CodingController } from '../controllers/coding.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', asyncHandler(CodingController.getAll));
router.get('/:slug', asyncHandler(CodingController.getBySlug));
router.post('/submit', authenticate, asyncHandler(CodingController.submit));

export default router;
