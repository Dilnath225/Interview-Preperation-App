import { Router } from 'express';
import { CertificateController } from '../controllers/certificate.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/verify/:credentialId', asyncHandler(CertificateController.verifyCertificate));
router.get('/download/:credentialId', asyncHandler(CertificateController.downloadCertificate));

// Authenticated candidate routes
router.use(authenticate);
router.post('/generate', asyncHandler(CertificateController.generateCertificate));
router.get('/my-certificate', asyncHandler(CertificateController.getMyCertificate));

export default router;
