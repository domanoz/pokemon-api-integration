import { AppError } from './AppError';

export class PokemonNotFoundError extends AppError {
    constructor(id: number) {
        super(`Pokemon with ID ${id} not found.`, 404);
        this.name = 'PokemonNotFoundError';
    }
}