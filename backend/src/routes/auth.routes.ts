import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(AuthController.register));
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(AuthController.verifyOtp));
router.post('/resend-otp', validate(resendOtpSchema), asyncHandler(AuthController.resendOtp));
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
router.get('/me', authenticate, asyncHandler(AuthController.me));

export default router;
