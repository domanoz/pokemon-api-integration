import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { injectable, inject } from "inversify";
import { HttpRequest } from "@azure/functions";
import { InvalidParameterError } from "../../HttpTrigger/errors/InvalidParameterError";
import { PokemonRequestDto } from "../../HttpTrigger/dto/PokemonRequestDto";
import { COMMON_INJECT_TOKENS } from "../../ioc/commonInjectTokens";
import { ILogger } from "../logger/ILogger";
import { IRequestValidationService } from "./IRequestValidationService";

@injectable()
export class RequestValidationService implements IRequestValidationService {
    constructor(
        @inject(COMMON_INJECT_TOKENS.ILogger) private readonly _logger: ILogger,
    ) { }

    public async validatePokemonRequest(request: HttpRequest): Promise<{ ids: number[]; type: string }> {
        this._logger.info("Validating Pokemon request parameters");

        const dto: PokemonRequestDto = plainToInstance(PokemonRequestDto, {
            ids: request.query.getAll('id')[0],
            type: request.query.get('type')
        });

        const errors: ValidationError[] = await validate(dto);

        if (errors.length > 0) {
            const messages: string[] = this.flattenValidationErrors(errors);
            throw new InvalidParameterError(messages.join('. '));
        }

        return {
            ids: dto.ids,
            type: dto.type
        };
    }

    private flattenValidationErrors(errors: ValidationError[]): string[] {
        return errors.reduce((messages: string[], error: ValidationError): string[] => {
            if (error.constraints) {
                messages.push(...Object.values(error.constraints));
            }
            if (error.children) {
                messages.push(...this.flattenValidationErrors(error.children));
            }
            return messages;
        }, []);
    }
}