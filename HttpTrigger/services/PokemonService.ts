import { injectable, inject } from "inversify";
import _ from 'lodash';
import { COMMON_INJECT_TOKENS } from "../../ioc/commonInjectTokens";
import { ILogger } from "../../commonServices/logger/ILogger";
import { IPokemonService } from "../interfaces/IPokemonService";
import { IPokemonApiClient, IPokeApiPokemonResponse } from "../interfaces/IPokemonApiClient";
import { Pokemon } from "../domain/Pokemon";
import { PokemonApiError } from "../errors/PokemonApiError";
import { PokemonNotFoundError } from "../errors/PokemonNotFoundError";

@injectable()
export class PokemonService implements IPokemonService {
    constructor(
        @inject(COMMON_INJECT_TOKENS.IPokemonApiClient) private readonly pokemonApiClient: IPokemonApiClient,
        @inject(COMMON_INJECT_TOKENS.ILogger) private readonly _logger: ILogger,
    ) { }

    public async getPokemons(ids: number[], type: string): Promise<string[]> {
        if (_.isEmpty(ids)) {
            return [];
        }

        const pokemonPromises: Promise<Pokemon>[] = ids.map((id): Promise<Pokemon> => this.getPokemonById(id));

        const results: PromiseSettledResult<Pokemon>[] = await Promise.allSettled(pokemonPromises);

        const fulfilledResults: PromiseFulfilledResult<Pokemon>[] = results.filter(
            (result): result is PromiseFulfilledResult<Pokemon> => result.status === 'fulfilled'
        );
        const rejectedResults: PromiseRejectedResult[] = results.filter(
            (result): result is PromiseRejectedResult => result.status === 'rejected'
        );

        const allRequestsFailed: boolean = rejectedResults.length === ids.length;
        if (allRequestsFailed) {
            const allFailedWithNotFound: boolean = _.every(rejectedResults, (r: PromiseRejectedResult): boolean => r.reason instanceof PokemonNotFoundError);
            if (allFailedWithNotFound) {
                this._logger.warn(`All requested Pokemon resulted in a not found error.`);
                throw new PokemonApiError("All requested Pokemon not found", 404);
            }

            this._logger.error(`All requested Pokemons failed to be retrieved with various errors.`);
            throw new PokemonApiError("Could not retrieve any of the requested Pokemon.", 503);
        }

        if (rejectedResults.length > 0) {
            this._logger.warn(`Failed to retrieve ${rejectedResults.length} out of ${ids.length} requested Pokemons.`);
        }

        const matchedPokemonNames: string[] = fulfilledResults
            .map((result): Pokemon => result.value)
            .filter((pokemon: Pokemon): boolean => pokemon.hasType(type))
            .map((pokemon: Pokemon): string => pokemon.name);

        return matchedPokemonNames;
    }

    public async getPokemonById(id: number): Promise<Pokemon> {
        const data: IPokeApiPokemonResponse = await this.pokemonApiClient.getPokemonById(id);

        return new Pokemon(
            data.id,
            data.name,
            data.types.map((t): string => t.type.name)
        );
    }
}