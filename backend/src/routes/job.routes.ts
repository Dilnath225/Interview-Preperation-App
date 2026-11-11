import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Candidate authenticated application endpoints
router.post('/:id/apply', authenticate, asyncHandler(JobController.applyToJob));
router.get('/my/applications', authenticate, asyncHandler(JobController.getMyApplications));

// Public Job Postings (for candidates to browse target companies' openings)
router.get('/', asyncHandler(JobController.getPublicJobs));
router.get('/:id', asyncHandler(JobController.getPublicJobById));

export default router;
