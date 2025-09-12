import { AppError } from './AppError';

export class PokemonApiError extends AppError {
    constructor(message: string, statusCode: number) {
        let errorMessage: string;
        let responseStatus: number;

        switch (statusCode) {
            case 400:
                errorMessage = message || 'Bad request to Pokemon API';
                responseStatus = 400;
                break;
            case 404:
                errorMessage = message || 'Pokemon not found';
                responseStatus = 404;
                break;
            case 429:
                errorMessage = message || 'Rate limit exceeded. Please try again later.';
                responseStatus = 429;
                break;
            default:
                errorMessage = `Pokemon API error: ${message}`;
                responseStatus = 503;
        }

        super(errorMessage, responseStatus);
    }
}