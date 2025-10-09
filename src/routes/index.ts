import { Router } from 'express';
import keywordRoutes from './keyword.routes';
import scanRoutes from './scan.routes';
import authRoutes from './auth.routes';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/keywords', authenticate, keywordRoutes);
router.use('/', authenticate, scanRoutes);

export default router;
