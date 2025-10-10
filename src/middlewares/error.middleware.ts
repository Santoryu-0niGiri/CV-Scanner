import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON response format
 */
export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: 'File upload error.' });
    }

    if (err.message?.includes('Firebase') || err.message?.includes('Firestore')) {
        return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error.' : err.message;

    res.status(statusCode).json({ error: message });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
