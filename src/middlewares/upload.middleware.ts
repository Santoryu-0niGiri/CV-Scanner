import multer from 'multer';
import { FILE_LIMITS } from '../utils/constants';

const storage = multer.memoryStorage();

/**
 * Multer middleware for file uploads
 * Accepts PDF and ZIP files up to 5MB
 */
export const upload = multer({ 
    storage: storage,
    limits: { fileSize: FILE_LIMITS.MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and ZIP files are allowed!'));
        }
    }
});
