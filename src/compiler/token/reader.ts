import { Optional } from "../../common/optional";
import type { TokenKind } from "./kinds";
import type { Token } from "./token";

interface Props {
    tokens: Token[]
}

export const createTokenReader = ({ tokens }: Props) => new TokenReader({ tokens });

export default class TokenReader {

    private readonly tokens: Token[]

    private index = 0

    constructor({ tokens }: Props) {
        this.tokens = tokens;
    }

    advance() {
        if(this.isAtEnd()) {
            return;
        }

        return this.index++;
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
        if(this.isAtEnd()) {
            return false;
        }

        const token = this.tokens[this.index];
        return kinds.includes(token.kind);
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }
}