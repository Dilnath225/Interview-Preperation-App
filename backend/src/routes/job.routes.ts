import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

// Candidate application endpoints
router.post('/:id/apply', optionalAuthenticate, asyncHandler(JobController.applyToJob));
router.get('/my/applications', authenticate, asyncHandler(JobController.getMyApplications));

// Public Job Postings (for candidates to browse target companies' openings)
router.get('/', asyncHandler(JobController.getPublicJobs));
router.get('/:id', asyncHandler(JobController.getPublicJobById));

export default router;
