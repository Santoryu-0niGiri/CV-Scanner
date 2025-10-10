import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

/**
 * Extended request interface with user data from JWT
 */
export interface AuthRequest extends Request {
    user?: { userId: string; email: string };
}

/**
 * JWT authentication middleware
 * Verifies Bearer token and attaches user data to request
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            throw new UnauthorizedError('Authentication token required.');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured.');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string };
        
        req.user = decoded;
        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(new UnauthorizedError('Invalid or expired token.'));
        } else {
            next(error);
        }
    }
};
