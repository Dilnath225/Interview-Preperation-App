import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Public Job Postings (for candidates to browse target companies' openings)
router.get('/', asyncHandler(JobController.getPublicJobs));
router.get('/:id', asyncHandler(JobController.getPublicJobById));

export default router;

