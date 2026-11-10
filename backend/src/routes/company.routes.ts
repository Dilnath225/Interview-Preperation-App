import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { JobController } from '../controllers/job.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticateCompany } from '../middlewares/companyAuth.middleware';

const router = Router();

// Public company auth
router.post('/auth/register', asyncHandler(CompanyController.register));
router.post('/auth/login', asyncHandler(CompanyController.login));

// Company-protected endpoints
router.use(authenticateCompany);

// Profile
router.get('/profile', asyncHandler(CompanyController.getProfile));
router.put('/profile', asyncHandler(CompanyController.updateProfile));

// Talent Pool
router.get('/talent', asyncHandler(CompanyController.browseTalent));
router.get('/talent/:userId', asyncHandler(CompanyController.getCandidateProfile));

// Recruiter Credential Verification
router.get('/verify/:credentialId', asyncHandler(CompanyController.verifyCandidateCredential));

// Company Job Postings Management
router.post('/jobs', asyncHandler(JobController.createJob));
router.get('/jobs', asyncHandler(JobController.getMyJobs));
router.get('/jobs/stats', asyncHandler(JobController.getJobStats));
router.put('/jobs/:id', asyncHandler(JobController.updateJob));
router.delete('/jobs/:id', asyncHandler(JobController.deleteJob));

export default router;

