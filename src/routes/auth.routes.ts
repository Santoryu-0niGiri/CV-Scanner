import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

/**
 * Authentication routes
 * POST /register - Create new user account
 * POST /login - Authenticate user and get JWT token
 */
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
