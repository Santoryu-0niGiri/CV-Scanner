import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    // Log error details
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Multer file upload errors
    if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File too large. Maximum size is 5MB.',
                error: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({ 
            message: 'File upload error.',
            error: err.message 
        });
    }

    // Firebase errors
    if (err.message?.includes('Firebase') || err.message?.includes('Firestore')) {
        return res.status(503).json({ 
            message: 'Database service unavailable.',
            error: 'DATABASE_ERROR'
        });
    }

    // Validation errors
    if (err.message?.includes('required') || err.message?.includes('invalid')) {
        return res.status(400).json({ 
            message: err.message,
            error: 'VALIDATION_ERROR'
        });
    }

    // Handle 401 Unauthorized errors
    if (err.statusCode === 401) {
        return res.status(401).json({ 
            error: err.message
        });
    }

    // Handle 404 Not Found errors
    if (err.statusCode === 404) {
        return res.status(404).json({ 
            error: err.message
        });
    }

    // Custom status code errors
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error.' : err.message;

    res.status(statusCode).json({ 
        message,
        error: err.code || 'SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({ 
        message: `Route ${req.method} ${req.path} not found.`,
        error: 'NOT_FOUND'
    });
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
