import { Router } from 'express';
import * as keywordController from '../controllers/keyword.controller';

/**
 * Keyword management routes (all protected)
 * POST / - Create keyword
 * GET / - List keywords with filtering, sorting, pagination
 * GET /:id - Get single keyword
 * PUT /:id - Update keyword name
 * PATCH /:id/status - Update keyword active status
 * DELETE /:id - Delete keyword
 */
const router = Router();

router.post('/', keywordController.createKeyword);
router.get('/', keywordController.getKeywords);
router.get('/:id', keywordController.getKeywordById);
router.put('/:id', keywordController.updateKeyword);
router.patch('/:id/status', keywordController.updateKeywordStatus);
router.delete('/:id', keywordController.deleteKeyword);

export default router;
