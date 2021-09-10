export const isTypeResolverError = (error: unknown): error is TypeResolvingError => error instanceof TypeResolvingError;

export class TypeResolvingError extends Error {
    constructor(public message: string) {
        super(message);

        Object.setPrototypeOf(this, TypeResolvingError.prototype);
    }
}