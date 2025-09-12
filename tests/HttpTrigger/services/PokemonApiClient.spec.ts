/* eslint-disable @typescript-eslint/unbound-method */
import "reflect-metadata";
import axios from "axios";
import { Container } from "inversify";
import { PokemonApiClient } from "../../../HttpTrigger/services/PokemonApiClient";
import { ILogger } from "../../../commonServices/logger/ILogger";
import { PokemonNotFoundError } from "../../../HttpTrigger/errors/PokemonNotFoundError";
import { PokemonApiError } from "../../../HttpTrigger/errors/PokemonApiError";
import { COMMON_INJECT_TOKENS } from "../../../ioc/commonInjectTokens";
import { IPokeApiPokemonResponse, IPokemonApiClient } from "../../../HttpTrigger/interfaces/IPokemonApiClient";

jest.mock("axios");
const mockedAxios: jest.Mocked<typeof axios> = axios as jest.Mocked<typeof axios>;

describe("PokemonApiClient", (): void => {
    let pokemonApiClient: IPokemonApiClient;
    let mockLogger: jest.Mocked<ILogger>;

    beforeEach((): void => {
        mockLogger = {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            verbose: jest.fn(),
        };

        const container: Container = new Container();
        container.bind<ILogger>(COMMON_INJECT_TOKENS.ILogger).toConstantValue(mockLogger);
        pokemonApiClient = container.resolve(PokemonApiClient);
    });

    afterEach((): void => {
        jest.clearAllMocks();
    });

    describe("getPokemonById", (): void => {
        it("should return pokemon data when API call is successful", async (): Promise<void> => {
            const pokemonId: number = 1;
            const mockResponse: { data: IPokeApiPokemonResponse } = {
                data: {
                    id: pokemonId,
                    name: "bulbasaur",
                    types: [{ type: { name: "grass", url: "https://test-api.com/v2/type/18" } }]
                }
            };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const result: IPokeApiPokemonResponse = await pokemonApiClient.getPokemonById(pokemonId);

            expect(result).toStrictEqual(mockResponse.data);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
            );
            expect(mockLogger.info).toHaveBeenCalledTimes(2);
        });

        it("should throw PokemonNotFoundError when API returns 404", async (): Promise<void> => {
            const pokemonId: number = 999;
            const mockAxiosError: any = {
                isAxiosError: true,
                message: 'Request failed with status code 404',
                name: 'Error',
                response: {
                    status: 404,
                    data: {
                        message: 'Pokemon not found'
                    },
                },
                config: {},
            };
            mockedAxios.isAxiosError.mockReturnValueOnce(true);
            mockedAxios.get.mockRejectedValueOnce(mockAxiosError);

            await expect(pokemonApiClient.getPokemonById(pokemonId))
                .rejects
                .toThrow(PokemonNotFoundError);
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it("should throw PokemonApiError with status when API returns error", async (): Promise<void> => {
            const pokemonId: number = 1;
            const mockAxiosError: any = {
                isAxiosError: true,
                message: 'Request failed with status code 500',
                name: 'Error',
                response: {
                    status: 500,
                    data: {
                        message: 'Pokemon not found'
                    },
                },
                config: {},
            };
            mockedAxios.isAxiosError.mockReturnValueOnce(true);
            mockedAxios.get.mockRejectedValue(mockAxiosError);


            await expect(pokemonApiClient.getPokemonById(pokemonId))
                .rejects
                .toThrow(PokemonApiError);
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it("should throw PokemonApiError with 503 on network error", async (): Promise<void> => {
            const pokemonId: number = 1;
            const error: Error = new Error("Network error");

            mockedAxios.get.mockRejectedValue(error);

            try {
                await pokemonApiClient.getPokemonById(pokemonId);
                fail("Should have thrown an error");
            } catch (e) {
                expect(e).toBeInstanceOf(PokemonApiError);
                expect((e as PokemonApiError).statusCode).toBe(503);
                expect(mockLogger.error).toHaveBeenCalled();
            }
        });
    });
});