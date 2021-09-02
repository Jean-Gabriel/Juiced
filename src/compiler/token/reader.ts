import { Optional } from "../../common/optional";
import type { TokenKind } from "./kinds";
import type { Token } from "./token";

interface Props {
    tokens: Token[]
}

export type TokenReaderFactory = (props: Props) => TokenReader
export const createTokenReader: TokenReaderFactory = ({ tokens }: Props) => new TokenReader({ tokens });

export default class TokenReader {

    private readonly tokens: Token[]

    private index = 0

    constructor({ tokens }: Props) {
        this.tokens = tokens;
    }

    advance() {
        if(this.isAtEnd()) {
            return null;
        }

        return this.tokens[++this.index];
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

    lookupForUntil(kind: TokenKind, condistionIsMet: (current: Token) => boolean) {
        let index = this.index;

        let current = this.tokens[index];
        while(current && !condistionIsMet(current) && !this.isPositionAtEnd(index)) {
            if(current.kind === kind) {
                return true;
            }

            current = this.tokens[index++];
        }

        return false;
    }

    isAtEnd(): boolean {
        return this.isPositionAtEnd(this.index);
    }

    private isPositionAtEnd(position: number) {
        return position >= this.tokens.length;
    }
}