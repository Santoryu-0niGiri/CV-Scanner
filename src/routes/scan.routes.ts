import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import * as scanController from '../controllers/scan.controller';

/**
 * CV scanning routes (all protected)
 * POST /scan - Scan single PDF CV
 * POST /rescan - Rescan existing CV with updated keywords
 * POST /batch/scan - Batch scan multiple CVs from ZIP
 * GET /scanned-cvs - List all scanned CVs
 * DELETE /scanned-cvs/:email - Delete scanned CV
 */
const router = Router();

router.post('/scan', upload.single('file'), scanController.scanCv);
router.post('/rescan', scanController.rescanCv);
router.post('/batch/scan', upload.single('file'), scanController.batchScanCvs);
router.get('/scanned-cvs', scanController.getAllScannedCvs);
router.delete('/scanned-cvs/:email', scanController.deleteScannedCv);

export default router;
