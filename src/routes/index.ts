import { Router } from 'express';
import keywordRoutes from './keyword.routes';
import scanRoutes from './scan.routes';
import authRoutes from './auth.routes';
import { authenticate } from '../middlewares/auth.middleware';

/**
 * Main API router
 * Combines all route modules with authentication
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/keywords', authenticate, keywordRoutes);
router.use('/', authenticate, scanRoutes);

export default router;
