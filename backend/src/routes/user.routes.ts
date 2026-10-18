import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile', asyncHandler(UserController.getProfile));
router.put('/profile', asyncHandler(UserController.updateProfile));
router.post('/avatar', uploadAvatar.single('avatar'), asyncHandler(UserController.uploadAvatar));
router.post('/change-password', asyncHandler(UserController.changePassword));
router.delete('/profile', asyncHandler(UserController.deleteAccount));
router.delete('/account', asyncHandler(UserController.deleteAccount));

export default router;
