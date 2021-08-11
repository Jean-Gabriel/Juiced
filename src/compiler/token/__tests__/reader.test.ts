import { TokenFixture } from "../../../../test/compiler/token/token";
import { Optional } from "../../../common/optional";
import { TokenKind } from "../kinds";
import { createTokenReader } from "../reader";

describe('TokenReader', () => {

    it('should not be at end', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW))
        ]});

        expect(reader.isAtEnd()).toBeFalsy();
    });

    it('should consume current token', () => {
        const token = TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW));
        const reader = createTokenReader({ tokens: [ token ] });

        const consumed = reader.consume(TokenKind.ARROW);

        expect(consumed).toEqual(Optional.of(token));
    });

    it('should advance after consuming', () => {
        const token = TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW));
        const otherToken = TokenFixture.create(_ => _.nonLiteral(TokenKind.BANG_EQUAL));
        const reader = createTokenReader({ tokens: [ token, otherToken ] });
        reader.consume(TokenKind.ARROW);

        const advanced = reader.currentIs(TokenKind.BANG_EQUAL);

        expect(advanced).toBeTruthy();
    });


    it('should not consume token not matching kinds', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW))
        ]});

        const consumed = reader.consume(TokenKind.BANG, TokenKind.BOOLEAN_TYPE);

        expect(consumed).toEqual(Optional.empty());
    });

    it('should not consume token not matching kinds', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW))
        ]});

        const consumed = reader.consume(TokenKind.BANG, TokenKind.BOOLEAN_TYPE);

        expect(consumed).toEqual(Optional.empty());
    });

    it('should be current kind', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW))
        ]});

        const isTokenKind = reader.currentIs(TokenKind.ARROW);

        expect(isTokenKind).toBeTruthy();
    });

    it('should not be current kind', () => {
        const reader = createTokenReader({ tokens: [
            TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW))
        ]});

        const isTokenKind = reader.currentIs(TokenKind.STAR);

        expect(isTokenKind).toBeFalsy();
    });

    describe('given reader is at end', () => {

        it('should be at end', () => {
            const reader = createTokenReader({ tokens: [] });

            expect(reader.isAtEnd()).toBeTruthy();
        });

        it('should return empty optional when consuming', () => {
            const reader = createTokenReader({ tokens: [] });

            const consumed = reader.consume(TokenKind.ARROW);

            expect(consumed).toEqual(Optional.empty());
        });

        it('should use last token as current token', () => {
            const reader = createTokenReader({ tokens: [
                TokenFixture.create(_ => _.nonLiteral(TokenKind.ARROW))
            ]});
            reader.consume(TokenKind.ARROW);

            const isTokenKind = reader.currentIs(TokenKind.ARROW);

            expect(isTokenKind).toBeTruthy();
        });
    });
});