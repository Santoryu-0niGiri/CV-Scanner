import { Router } from 'express';
import * as keywordController from '../controllers/keyword.controller';

const router = Router();

router.post('/', keywordController.createKeyword);
router.get('/', keywordController.getKeywords);
router.get('/:id', keywordController.getKeywordById);
router.put('/:id', keywordController.updateKeyword);
router.patch('/:id/status', keywordController.updateKeywordStatus);
router.delete('/:id', keywordController.deleteKeyword);

export default router;
