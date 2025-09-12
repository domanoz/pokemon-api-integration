import { injectable } from "inversify";
import { InvocationContext } from "@azure/functions";
import { ILogger } from "./ILogger";

@injectable()
export class Logger implements ILogger {

    private _ctx: InvocationContext;
    private _processId: string;

    public init(ctx: InvocationContext, processId: string): void {
        this._ctx = ctx;
        this._processId = processId;
    }

    public error(message: string): void {
        this._ctx.error(`${message}, processId: ${this._processId}`);
    }

    public warn(message: string): void {
        this._ctx.warn(`${message}, processId: ${this._processId}`);
    }

    public info(message: string): void {
        this._ctx.info(`${message}, processId: ${this._processId}`);
    }

    public verbose(message: string): void {
        this._ctx.log(`${message}, processId: ${this._processId}`);
    }
}
