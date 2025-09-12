import axios, { AxiosResponse } from "axios";
import { injectable, inject } from "inversify";
import { PokemonNotFoundError } from "../errors/PokemonNotFoundError";
import { PokemonApiError } from "../errors/PokemonApiError";
import { IPokemonApiClient, IPokeApiPokemonResponse } from "../interfaces/IPokemonApiClient";
import { ILogger } from "../../commonServices/logger/ILogger";
import { COMMON_INJECT_TOKENS } from "../../ioc/commonInjectTokens";

@injectable()
export class PokemonApiClient implements IPokemonApiClient {
    private static readonly BASE_URL: string = "https://pokeapi.co/api/v2";

    constructor(
        @inject(COMMON_INJECT_TOKENS.ILogger) private readonly _logger: ILogger,
    ) { }

    private mapError(error: unknown, id: number, duration: number): never {
        if (axios.isAxiosError(error)) {
            const status: number = error.response?.status || 500;
            const apiErrorResponse: { message?: string } | undefined = error.response?.data as { message?: string } | undefined;
            const errorMessage: string | undefined = apiErrorResponse?.message;

            this._logger.error(
                `Pokemon API request failed after ${duration}ms. ID: ${id}, Status: ${status}, Message: ${errorMessage || 'No message'}`
            );

            if (status === 404) {
                throw new PokemonNotFoundError(id);
            }

            throw new PokemonApiError(
                `Failed to fetch pokemon with ID ${id}${errorMessage ? `: ${errorMessage}` : ''}`,
                status
            );
        }

        this._logger.error(
            `Pokemon API request failed after ${duration}ms with network error. ID: ${id}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        throw new PokemonApiError('Network or connectivity error occurred', 503);
    }

    public async getPokemonById(id: number): Promise<IPokeApiPokemonResponse> {
        const startTime: number = Date.now();

        try {
            const url: string = `${PokemonApiClient.BASE_URL}/pokemon/${id}`;
            this._logger.info(`Fetching Pokemon from: ${url}`);

            const response: AxiosResponse<IPokeApiPokemonResponse> = await axios.get<IPokeApiPokemonResponse>(url);

            const duration: number = Date.now() - startTime;
            this._logger.info(`Pokemon API request completed in ${duration}ms for ID: ${id}`);

            return response.data;
        } catch (error: unknown) {
            const duration: number = Date.now() - startTime;

            throw this.mapError(error, id, duration);
        }
    }

}