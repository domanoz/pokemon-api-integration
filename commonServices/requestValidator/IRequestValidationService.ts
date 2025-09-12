import { HttpRequest } from "@azure/functions";

export interface IRequestValidationService {
    validatePokemonRequest(request: HttpRequest): Promise<{
        ids: number[]
        type: string
    }>
}