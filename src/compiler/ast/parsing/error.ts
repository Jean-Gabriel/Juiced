class ParsingError extends Error {
    constructor(
        public message: string
    ) {
        super(message);
    }
}