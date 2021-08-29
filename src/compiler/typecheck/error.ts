export const isTypecheckingError = (error: unknown): error is TypecheckingError => error instanceof TypecheckingError;

export class TypecheckingError extends Error {
    constructor(public message: string) {
        super(message);

        Object.setPrototypeOf(this, TypecheckingError.prototype);
    }
}