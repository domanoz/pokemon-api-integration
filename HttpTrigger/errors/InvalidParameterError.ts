import { AppError } from './AppError';

export class InvalidParameterError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}