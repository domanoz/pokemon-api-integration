/* eslint-disable @typescript-eslint/unbound-method */
import "reflect-metadata";
import { Container } from "inversify";
import { HttpRequest } from "@azure/functions";
import { COMMON_INJECT_TOKENS } from "../../../ioc/commonInjectTokens";
import { ILogger } from "../../../commonServices/logger/ILogger";
import { RequestValidationService } from "../../../commonServices/requestValidator/RequestValidationService";
import { InvalidParameterError } from "../../../HttpTrigger/errors/InvalidParameterError";

describe("RequestValidationService", (): void => {
    let validationService: RequestValidationService;
    let mockLogger: jest.Mocked<ILogger>;
    let mockRequest: jest.Mocked<HttpRequest>;

    const createMockRequest: (ids: string | undefined, type: string | undefined) => jest.Mocked<HttpRequest> = (ids: string | undefined, type: string | undefined): jest.Mocked<HttpRequest> => {
        return {
            query: {
                getAll: jest.fn().mockReturnValue(ids ? [ids] : []),
                get: jest.fn().mockReturnValue(type)
            }
        } as unknown as jest.Mocked<HttpRequest>;
    };

    beforeEach((): void => {
        mockLogger = {
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            verbose: jest.fn(),
        };

        const container: Container = new Container();
        container.bind<ILogger>(COMMON_INJECT_TOKENS.ILogger).toConstantValue(mockLogger);
        validationService = container.resolve(RequestValidationService);
    });

    describe("validatePokemonRequest", (): void => {
        it("should validate and transform valid request parameters", async (): Promise<void> => {
            mockRequest = createMockRequest("1,2,3", "fire");
            const result: { ids: number[]; type: string } = await validationService.validatePokemonRequest(mockRequest);

            expect(result).toEqual({
                ids: [1, 2, 3],
                type: "fire"
            });
            expect(mockLogger.info).toHaveBeenCalledWith("Validating Pokemon request parameters");
        });

        it("should handle single ID parameter", async (): Promise<void> => {
            mockRequest = createMockRequest("1", "water");
            const result: { ids: number[]; type: string } = await validationService.validatePokemonRequest(mockRequest);

            expect(result).toEqual({
                ids: [1],
                type: "water"
            });
        });

        it("should throw InvalidParameterError when IDs are missing", async (): Promise<void> => {
            mockRequest = createMockRequest(undefined, "fire");

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });

        it("should throw InvalidParameterError when type is missing", async (): Promise<void> => {
            mockRequest = createMockRequest("1,2,3", undefined);

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });

        it("should throw InvalidParameterError when IDs are not numbers", async (): Promise<void> => {
            mockRequest = createMockRequest("1,abc,3", "fire");

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });

        it("should throw InvalidParameterError when type is empty", async (): Promise<void> => {
            mockRequest = createMockRequest("1,2,3", "");

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });

        it("should handle duplicate IDs in input", async (): Promise<void> => {
            mockRequest = createMockRequest("1,1,2", "fire");
            const result: { ids: number[]; type: string } = await validationService.validatePokemonRequest(mockRequest);

            expect(result).toEqual({
                ids: [1, 2],
                type: "fire"
            });
        });

        it("should throw InvalidParameterError when both query params are invalid", async (): Promise<void> => {
            mockRequest = createMockRequest("abc", "");

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });

        it("should transform type to lower case", async (): Promise<void> => {
            mockRequest = createMockRequest("1,2,3", "FIRE");

            const result: { ids: number[]; type: string } = await validationService.validatePokemonRequest(mockRequest);
            expect(result).toEqual({
                ids: [1, 2, 3],
                type: "fire"
            });
        });

        it("should throw InvalidParameterError for negative IDs", async (): Promise<void> => {
            mockRequest = createMockRequest("-1,2,3", "fire");

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });

        it("should throw InvalidParameterError for decimal IDs", async (): Promise<void> => {
            mockRequest = createMockRequest("1.5,2,3", "fire");

            await expect(validationService.validatePokemonRequest(mockRequest))
                .rejects
                .toThrow(InvalidParameterError);
        });
    });
});