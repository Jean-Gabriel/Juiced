import { TokenFixture } from "../../../../test/compiler/token/token";
import { Optional } from "../../../common/optional";
import { TokenKind } from "../kinds";
import { createTokenReader } from "../reader";

describe('TokenReader', () => {

    it('should not be at end', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
        ]});

        expect(reader.isAtEnd()).toBeFalsy();
    });

    it('should consume current token', () => {
        const token = TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON));
        const reader = createTokenReader({ tokens: [ token ] });

        const consumed = reader.consume(TokenKind.SEMICOLON);

        expect(consumed).toEqual(Optional.of(token));
    });

    it('should advance after consuming', () => {
        const token = TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON));
        const otherToken = TokenFixture.create(_ => _.nonLiteral(TokenKind.BANG_EQUAL));
        const reader = createTokenReader({ tokens: [ token, otherToken ] });
        reader.consume(TokenKind.SEMICOLON);

        const advanced = reader.currentIs(TokenKind.BANG_EQUAL);

        expect(advanced).toBeTruthy();
    });


    it('should not consume token not matching kinds', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
        ]});

        const consumed = reader.consume(TokenKind.BANG, TokenKind.BOOLEAN_TYPE);

        expect(consumed).toEqual(Optional.empty());
    });

    it('should not consume token not matching kinds', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
        ]});

        const consumed = reader.consume(TokenKind.BANG, TokenKind.BOOLEAN_TYPE);

        expect(consumed).toEqual(Optional.empty());
    });

    it('should be current kind', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
        ]});

        const isTokenKind = reader.currentIs(TokenKind.SEMICOLON);

        expect(isTokenKind).toBeTruthy();
    });

    it('should not be current kind', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
        ]});

        const isTokenKind = reader.currentIs(TokenKind.STAR);

        expect(isTokenKind).toBeFalsy();
    });

    it('should find token until condition is met', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON)),
            TokenFixture.create(_ => _.nonLiteral(TokenKind.FUN)),
            TokenFixture.create(_ => _.nonLiteral(TokenKind.CONST))
        ]});

        const found = reader.lookupForUntil(TokenKind.FUN, (token) => token.kind === TokenKind.CONST);

        expect(found).toBeTruthy();
    });

    it('should not find missing token token until condition is met', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON)),
            TokenFixture.create(_ => _.nonLiteral(TokenKind.FUN)),
        ]});

        const found = reader.lookupForUntil(TokenKind.CONST, (token) => token.kind === TokenKind.FUN);

        expect(found).toBeFalsy();
    });

    it('given condition is never met, it should not find token', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
        ]});

        const found = reader.lookupForUntil(TokenKind.CONST, (token) => token.kind === TokenKind.FUN);

        expect(found).toBeFalsy();
    });

    it('should get current token', () => {
        const bang = TokenFixture.create(_ => _.nonLiteral(TokenKind.BANG));
        const reader = createTokenReader({ tokens: [ bang ]});

        const current = reader.current();

        expect(current).toEqual(bang);
    });

    describe('given reader is at end', () => {

        it('should be at end', () => {
            const reader = createTokenReader({ tokens: [] });

            expect(reader.isAtEnd()).toBeTruthy();
        });

        it('should consider last token as current token', () => {
            const bang = TokenFixture.create(_ => _.nonLiteral(TokenKind.BANG));
            const reader = createTokenReader({ tokens: [ bang ]});
            reader.advance();

            const current = reader.current();

            expect(current).toEqual(bang);
        });

        it('should return empty optional when consuming', () => {
            const reader = createTokenReader({ tokens: [] });

            const consumed = reader.consume(TokenKind.SEMICOLON);

            expect(consumed).toEqual(Optional.empty());
        });

        it('should never match current', () => {
            const reader = createTokenReader({ tokens: [
                TokenFixture.create(_ => _.nonLiteral(TokenKind.SEMICOLON))
            ]});
            reader.consume(TokenKind.SEMICOLON);

            const isTokenKind = reader.currentIs(TokenKind.SEMICOLON);

            expect(isTokenKind).toBeFalsy();
        });
    });
});