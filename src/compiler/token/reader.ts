import type { TokenKind } from "./kinds";
import type { Token } from "./token";

interface Props {
    tokens: Token[]
}

const createTokenReader = (tokens: Token[]) => new TokenReader({ tokens });

export default class TokenReader {

    private readonly tokens: Token[]

    private index = 0

    constructor({ tokens }: Props) {
        this.tokens = tokens;
    }

    consume(...kinds: TokenKind[]): Optional<Token> {
        if(this.isAtEnd()) {
            return Optional.empty();
        }

        const current = this.tokens[this.index];
        if(!kinds.includes(current.kind)) {
            return Optional.empty();
        }

        this.index++;
        return Optional.of(current);
    }

    current(): Token {
        if(this.isAtEnd()) {
            return this.tokens[this.index - 1];
        }

        return this.tokens[this.index];
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }
}