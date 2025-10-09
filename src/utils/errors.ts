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

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, 'NOT_FOUND');
    }
}

export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, 503, 'DATABASE_ERROR');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401, 'UNAUTHORIZED');
    }
}
