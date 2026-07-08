import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post(
  '/register',
  validateBody(registerSchema),
  authController.register,
);

router.post(
  '/login',
  validateBody(loginSchema),
  authController.login,
);

router.get('/me', authenticate, authController.getMe);

export default router;
