/**
 * Base application error class with status code and error code
 */
export class AppError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 400 Bad Request error for validation failures
 */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

/**
 * 404 Not Found error for missing resources
 */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, 'NOT_FOUND');
    }
}

/**
 * 503 Service Unavailable error for database issues
 */
export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 503, 'DATABASE_ERROR');
    }
}

/**
 * 401 Unauthorized error for authentication failures
 */
export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401, 'UNAUTHORIZED');
    }
}
