class Optional<T> {
    static of<T>(value: T) {
        return new Optional(value);
    }

    static empty<T>() {
        return new Optional<T>(null);
    }

    private constructor(
        private readonly value: T | null
    ) {}

    orElseThrow(error: Error): T {
        if(this.value === null) {
            throw error;
        }

        return this.value;
    }
}