import { injectable, inject } from "inversify";
import { HttpResponseInit } from "@azure/functions";
import { COMMON_INJECT_TOKENS } from "../../ioc/commonInjectTokens";
import { AppError } from "../../HttpTrigger/errors/AppError";
import { ILogger } from "../logger/ILogger";
import { IErrorHandlingService } from "./IErrorHandlingService";

@injectable()
export class ErrorHandlingService implements IErrorHandlingService {
    constructor(
        @inject(COMMON_INJECT_TOKENS.ILogger) private readonly _logger: ILogger
    ) { }

    public handleError(error: unknown, context: string): HttpResponseInit {
        let statusCode: number = 500;
        let message: string = 'Internal server error';

        if (error instanceof AppError) {
            statusCode = error.statusCode;
            message = error.message;
        } else if (error instanceof Error) {
            message = error.message;
        }

        this._logger.error(`${context}: ${message}`);

        return {
            status: statusCode,
            jsonBody: { message },
            headers: { 'Content-Type': 'application/json' }
        };
    }
}