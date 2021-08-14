export const isParsingError = (error: unknown): error is ParsingError => error instanceof ParsingError;

export class ParsingError extends Error {
    constructor(public message: string) {
        super(message);

        Object.setPrototypeOf(this, ParsingError.prototype);
    }
}