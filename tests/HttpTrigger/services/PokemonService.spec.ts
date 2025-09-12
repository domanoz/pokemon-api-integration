/* eslint-disable @typescript-eslint/unbound-method */
import "reflect-metadata";
import { Container } from "inversify";
import { COMMON_INJECT_TOKENS } from "../../../ioc/commonInjectTokens";
import { PokemonService } from "../../../HttpTrigger/services/PokemonService";
import { IPokeApiPokemonResponse, IPokemonApiClient } from "../../../HttpTrigger/interfaces/IPokemonApiClient";
import { ILogger } from "../../../commonServices/logger/ILogger";
import { Pokemon } from "../../../HttpTrigger/domain/Pokemon";
import { PokemonNotFoundError } from "../../../HttpTrigger/errors/PokemonNotFoundError";
import { PokemonApiError } from "../../../HttpTrigger/errors/PokemonApiError";


describe("PokemonService", (): void => {
    let pokemonService: PokemonService;
    let mockPokemonApiClient: jest.Mocked<IPokemonApiClient>;
    let mockLogger: jest.Mocked<ILogger>;

    const createMockPokemon: (id: number, name: string, types: string[]) => IPokeApiPokemonResponse = (id: number, name: string, types: string[]): IPokeApiPokemonResponse => ({
        id,
        name,
        types: types.map((type): { type: { name: string; url: string } } => ({
            type: { name: type, url: `https://pokeapi.co/api/v2/type/${id}` }
        }))
    });

    beforeEach((): void => {
        mockPokemonApiClient = {
            getPokemonById: jest.fn()
        };

        mockLogger = {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            verbose: jest.fn(),
        };

        const container: Container = new Container();
        container.bind<IPokemonApiClient>(COMMON_INJECT_TOKENS.IPokemonApiClient).toConstantValue(mockPokemonApiClient);
        container.bind<ILogger>(COMMON_INJECT_TOKENS.ILogger).toConstantValue(mockLogger);
        pokemonService = container.resolve(PokemonService);
    });

    describe("getPokemons", (): void => {
        it("should return pokemon names filtered by type", async (): Promise<void> => {
            const ids: number[] = [1, 2, 3];
            const type: string = "fire";

            mockPokemonApiClient.getPokemonById
                .mockResolvedValueOnce(createMockPokemon(1, "charmander", ["fire"]))
                .mockResolvedValueOnce(createMockPokemon(2, "squirtle", ["water"]))
                .mockResolvedValueOnce(createMockPokemon(3, "charmeleon", ["fire"]));

            const result: string[] = await pokemonService.getPokemons(ids, type);

            expect(result).toEqual(["charmander", "charmeleon"]);
            expect(mockPokemonApiClient.getPokemonById).toHaveBeenCalledTimes(3);
        });

        it("should handle empty input array", async (): Promise<void> => {
            const ids: number[] = [];
            const type: string = "fire";

            const result: string[] = await pokemonService.getPokemons(ids, type);

            expect(result).toEqual([]);
            expect(mockPokemonApiClient.getPokemonById).not.toHaveBeenCalled();
        });

        it("should handle case-insensitive type matching", async (): Promise<void> => {
            const ids: number[] = [1];
            const type: string = "FIRE";

            mockPokemonApiClient.getPokemonById
                .mockResolvedValueOnce(createMockPokemon(1, "charmander", ["fire"]));

            const result: string[] = await pokemonService.getPokemons(ids, type);

            expect(result).toEqual(["charmander"]);
            expect(mockPokemonApiClient.getPokemonById).toHaveBeenCalledTimes(1);
        });

        it("should include dual-type pokemon when matching either type", async (): Promise<void> => {
            const ids: number[] = [1, 2, 3];
            const type: string = "poison";

            mockPokemonApiClient.getPokemonById
                .mockResolvedValueOnce(createMockPokemon(1, "bulbasaur", ["grass", "poison"]))
                .mockResolvedValueOnce(createMockPokemon(2, "charmander", ["fire"]))
                .mockResolvedValueOnce(createMockPokemon(3, "charmanderWithPoison", ["fire", "poison"]));


            const result: string[] = await pokemonService.getPokemons(ids, type);

            expect(result).toEqual(["bulbasaur", "charmanderWithPoison"]);
            expect(mockPokemonApiClient.getPokemonById).toHaveBeenCalledTimes(3);
        });

        it("should handle partial failures and return successful results", async (): Promise<void> => {
            const ids: number[] = [1, 2, 3];
            const type: string = "fire";

            mockPokemonApiClient.getPokemonById
                .mockResolvedValueOnce({
                    id: 1,
                    name: "charmander",
                    types: [{ type: { name: "fire", url: "test" } }]
                })
                .mockRejectedValueOnce(new PokemonNotFoundError(2))
                .mockResolvedValueOnce({
                    id: 3,
                    name: "charmeleon",
                    types: [{ type: { name: "fire", url: "test" } }]
                });

            const result: string[] = await pokemonService.getPokemons(ids, type);

            expect(result).toEqual(["charmander", "charmeleon"]);
            expect(mockPokemonApiClient.getPokemonById).toHaveBeenCalledTimes(3);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                "Failed to retrieve 1 out of 3 requested Pokemons."
            );
        });

        it("should throw error when all requests fail with not found errors", async (): Promise<void> => {
            const ids: number[] = [1, 2];
            const type: string = "fire";

            mockPokemonApiClient.getPokemonById
                .mockRejectedValueOnce(new PokemonNotFoundError(1))
                .mockRejectedValueOnce(new PokemonNotFoundError(2));

            await expect(pokemonService.getPokemons(ids, type))
                .rejects
                .toThrow(new PokemonApiError("All requested Pokemon not found", 404));

            expect(mockLogger.warn).toHaveBeenCalledWith(
                "All requested Pokemon resulted in a not found error."
            );
        });

        it("should throw error when all requests fail with mixed errors", async (): Promise<void> => {
            const ids: number[] = [1, 2];
            const type: string = "fire";

            mockPokemonApiClient.getPokemonById
                .mockRejectedValueOnce(new PokemonNotFoundError(1))
                .mockRejectedValueOnce(new PokemonApiError("Rate limit exceeded", 429));

            await expect(pokemonService.getPokemons(ids, type))
                .rejects
                .toThrow(new PokemonApiError("Could not retrieve any of the requested Pokemon.", 503));

            expect(mockLogger.error).toHaveBeenCalledWith(
                "All requested Pokemons failed to be retrieved with various errors."
            );
        });
    });

    describe("getPokemonById", (): void => {
        it("should return pokemon data when found", async (): Promise<void> => {
            const id: number = 1;
            mockPokemonApiClient.getPokemonById.mockResolvedValue({
                id: 1,
                name: "bulbasaur",
                types: [{ type: { name: "grass", url: "test" } }]
            });

            const result: Pokemon = await pokemonService.getPokemonById(id);

            expect(result).toBeInstanceOf(Pokemon);
            expect(result.name).toBe("bulbasaur");
            expect(result.hasType("grass")).toBe(true);
        });
    });
});