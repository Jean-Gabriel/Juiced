import { Optional } from "../../common/optional";
import { TokenKind } from "./kinds";
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
            return;
        }

        return this.index++;
    }

    consume(...kinds: TokenKind[]): Optional<Token> {
        if(this.isAtEnd()) {
            return Optional.empty();
        }

        if(this.currentIs(TokenKind.FRESH_LINE) && !kinds.includes(TokenKind.FRESH_LINE)) {
            this.advance();
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
        if(this.tokens[this.index].kind === TokenKind.FRESH_LINE && !kinds.includes(TokenKind.FRESH_LINE)) {
            this.advance();
        }

        return kinds.includes(token.kind);
    }

    lookupForUntil(token: TokenKind, condistionIsMet: (current: Token) => boolean) {
        let index = this.index;
        let isAtEnd = () => index >= this.tokens.length;

        let current = this.tokens[index];
        while(current && !condistionIsMet(current) && !isAtEnd()) {
            if(current.kind === token) {
                return true;
            }
            current = this.tokens[index++];
        }

        return false;
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }
}