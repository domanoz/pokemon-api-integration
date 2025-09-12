import 'reflect-metadata';
import { app, FunctionHandler, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { interfaces } from 'inversify';
import getContainer from '../ioc/inversify.config';
import { ILogger } from '../commonServices/logger/ILogger';
import { COMMON_INJECT_TOKENS } from '../ioc/commonInjectTokens';
import { IErrorHandlingService } from '../commonServices/errorHandler/IErrorHandlingService';
import { IRequestValidationService } from '../commonServices/requestValidator/IRequestValidationService';
import { IPokemonService } from './interfaces/IPokemonService';

const httpTriggerHandler: FunctionHandler = async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const container: interfaces.Container = getContainer(ctx, "1");
    const logger: ILogger = container.get<ILogger>(COMMON_INJECT_TOKENS.ILogger);
    const validationService: IRequestValidationService = container.get<IRequestValidationService>(COMMON_INJECT_TOKENS.IRequestValidationService);
    const errorHandler: IErrorHandlingService = container.get<IErrorHandlingService>(COMMON_INJECT_TOKENS.IErrorHandlingService);

    const pokemonService: IPokemonService = container.get<IPokemonService>(COMMON_INJECT_TOKENS.IPokemonService);

    logger.info(`Http trigger invoked`);

    try {
        const { ids, type } = await validationService.validatePokemonRequest(req);
        const pokemonNames: string[] = await pokemonService.getPokemons(ids, type);

        return {
            status: 200,
            jsonBody: {
                pokemons: pokemonNames
            },
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error: unknown) {
        return errorHandler.handleError(error, 'Error processing request');
    }
};

app.http('HttpTrigger', {
    handler: httpTriggerHandler,
    route: 'HttpTrigger',
    trigger: {
        name: 'HttpTrigger',
        route: 'HttpTrigger',
        type: 'httpTrigger',
        methods: ['GET'],
        authLevel: 'function',
    },
});
