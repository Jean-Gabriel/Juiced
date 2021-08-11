import { Optional } from "../../common/Optional";
import type { TokenKind } from "./kinds";
import type { Token } from "./token";

interface Props {
    tokens: Token[]
}

export const createTokenReader = (tokens: Token[]) => new TokenReader({ tokens });

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

    currentIs(...kinds: TokenKind[]): boolean {
        const token = this.isAtEnd() ? this.tokens[this.index - 1] : this.tokens[this.index];

        return kinds.includes(token.kind);
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }
}