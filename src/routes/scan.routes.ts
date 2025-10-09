import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import * as scanController from '../controllers/scan.controller';

const router = Router();

router.post('/scan', upload.single('file'), scanController.scanCv);
router.post('/rescan', scanController.rescanCv);
router.post('/batch/scan', upload.single('file'), scanController.batchScanCvs);
router.get('/scanned-cvs', scanController.getAllScannedCvs);
router.delete('/scanned-cvs/:email', scanController.deleteScannedCv);

export default router;
