import { HttpResponseInit } from "@azure/functions";

export interface IErrorHandlingService {
    handleError(error: unknown, context: string): HttpResponseInit
}