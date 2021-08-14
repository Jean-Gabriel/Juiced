
export class Optional<T> {
    static of<T>(value: T) {
        return new Optional(value);
    }

    static empty<T>() {
        return new Optional<T>(null);
    }

    private constructor(
        private readonly value: T | null
    ) {}

    unguard<S extends T>(f: (value: T) => value is NonNullable<S>): Optional<S> {
        if(this.value === null) {
            return Optional.empty();
        }

        if(!f(this.value)) {
            return Optional.empty();
        }

        return Optional.of(this.value);
    }

    map<S>(f: (value: T) => S | undefined | null): Optional<S> {
        if(this.value === null) {
            return Optional.empty();
        }

        const mapped = f(this.value);
        if(mapped === null || mapped === undefined) {
            return Optional.empty();
        }

        return Optional.of(mapped);
    }

    orElseThrow(error: Error): T {
        if(this.value === null) {
            throw error;
        }

        return this.value;
    }

    orElseMap(f: () => T): T {
        if(this.value === null) {
            return f();
        }

        return this.value;
    }

    ifEmpty(f: () => void) {
        if(this.value === null) {
            return f();
        }
    }
}