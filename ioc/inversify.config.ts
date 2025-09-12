import { Container, interfaces } from "inversify";
import { InvocationContext } from "@azure/functions";
import { Logger } from "../commonServices/logger/Logger";
import { ILogger } from "../commonServices/logger/ILogger";
import { IPokemonService } from "../HttpTrigger/interfaces/IPokemonService";
import { PokemonService } from "../HttpTrigger/services/PokemonService";
import { IPokemonApiClient } from "../HttpTrigger/interfaces/IPokemonApiClient";
import { PokemonApiClient } from "../HttpTrigger/services/PokemonApiClient";
import { ErrorHandlingService } from "../commonServices/errorHandler/ErrorHandlingService";
import { IErrorHandlingService } from "../commonServices/errorHandler/IErrorHandlingService";
import { IRequestValidationService } from "../commonServices/requestValidator/IRequestValidationService";
import { RequestValidationService } from "../commonServices/requestValidator/RequestValidationService";
import { COMMON_INJECT_TOKENS } from "./commonInjectTokens";

const getContainer: (ctx: InvocationContext, processId: string) => interfaces.Container =
    (ctx: InvocationContext, processId: string): interfaces.Container => {
        const container: interfaces.Container = new Container();

        container
            .bind<ILogger>(COMMON_INJECT_TOKENS.ILogger)
            .toDynamicValue((): ILogger => {
                const logger: Logger = new Logger();
                logger.init(ctx, processId);
                return logger;
            })
            .inSingletonScope();

        container
            .bind<IPokemonService>(COMMON_INJECT_TOKENS.IPokemonService)
            .to(PokemonService)
            .inSingletonScope();

        container
            .bind<IPokemonApiClient>(COMMON_INJECT_TOKENS.IPokemonApiClient)
            .to(PokemonApiClient)
            .inSingletonScope();

        container
            .bind<IErrorHandlingService>(COMMON_INJECT_TOKENS.IErrorHandlingService)
            .to(ErrorHandlingService)
            .inSingletonScope();

        container
            .bind<IRequestValidationService>(COMMON_INJECT_TOKENS.IRequestValidationService)
            .to(RequestValidationService)
            .inSingletonScope();

        return container;
    };

export default getContainer;
