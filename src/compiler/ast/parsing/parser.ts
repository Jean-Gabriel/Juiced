import type { DiagnosticReporter } from "../../../diagnostic/reporter";
import { DiagnosticCategory } from "../../../diagnostic/reporter";
import type TokenReader from "../../token/reader";
import type { Source, TopLevelDeclaration } from "../nodes/source";
import AstBuilder from "../nodes/builder";
import { TokenKind } from "../../token/kinds";
import type { TypedIdentifier } from "../nodes/identifier";
import type { Statement } from "../nodes/statements/statement";
import type { StringLiteralToken, Token } from "../../token/token";
import { booleanLiteralToken } from "../../token/token";
import { numberLiteralToken } from "../../token/token";
import { stringLiteralToken } from "../../token/token";
import { binaryOperators, unaryOperators } from "../nodes/expressions/operators";
import type { Expression } from "../nodes/expressions/expression";
import { isParsingError, ParsingError } from "./error";

interface Parser {
    parse: () => Source
}

interface ErrorHandlingOptions {
    recoverTo?: TokenKind[]
}

export const createParser = (
    createTokenReader: () => TokenReader,
    createDiagnosticReporter: () => DiagnosticReporter
): Parser => {

    const EXPRESSION_TOKENS = [ TokenKind.INT, TokenKind.FLOAT, TokenKind.BOOLEAN, TokenKind.IDENTIFIER ];
    const TOP_LEVEL_EXPRESSION_TOKENS = [ TokenKind.INT, TokenKind.FLOAT, TokenKind.BOOLEAN ];

    const EMPTY_TOKEN: Token = { kind: TokenKind.ARROW, lexeme: '', line: 0 };

    const EMPTY_IDENTIFIER_TOKEN: StringLiteralToken = { kind: TokenKind.IDENTIFIER, lexeme: '', line: 0, literal: '' };
    const EMPTY_IDENTIFIER = AstBuilder.identifier({ value: '' });

    const EMPTY_EXPRESSION = AstBuilder.accessor({ identifier: EMPTY_IDENTIFIER });
    const EMPTY_VARIABLE_DECLARATION = AstBuilder.variableDeclaration({ identifier: EMPTY_IDENTIFIER, expression: EMPTY_EXPRESSION });
    const EMPTY_EXPORT = AstBuilder.exportation({ declaration: EMPTY_VARIABLE_DECLARATION });

    const parse = (): Source => {
        const reader = createTokenReader();
        const reporter = createDiagnosticReporter();

        const topLevelDeclaration = (): TopLevelDeclaration => {
            if(reader.currentIs(TokenKind.EXPORT)) {
                return exportDeclaration();
            }

            try {
                return expression();
            } catch(e: unknown) {
                handleError(e, { recoverTo: [ TokenKind.EXPORT, ...TOP_LEVEL_EXPRESSION_TOKENS ] });
                return EMPTY_EXPRESSION;
            }
        };

        const exportDeclaration = () => {
            reader.consume(TokenKind.EXPORT);

            try {
                return AstBuilder.exportation({ declaration: declaration() });
            } catch(e: unknown) {
                handleError(e);
                return EMPTY_EXPORT;
            }
        };

        const declaration = () => {
            reader.consume(TokenKind.LET).ifEmpty(() => handleError(new ParsingError('Expected let keyword at start of declaration.')));

            const identifier = reader
                .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                .orElseMap(() => {
                    handleError(new ParsingError('Expected identifier after let keyword.'));
                    return EMPTY_IDENTIFIER_TOKEN;
                });

            reader.consume(TokenKind.EQUAL).ifEmpty(() => handleError(new ParsingError('Expected = after identifier.')));

            if(reader.currentIs(TokenKind.OPEN_PARENTHESIS)) {
                return functionDeclaration(identifier);
            }

            try {
                return variableDeclaration(identifier);
            } catch(e: unknown) {
                handleError(e);
                return EMPTY_VARIABLE_DECLARATION;
            }
        };

        const statement = () => {
            if(reader.currentIs(TokenKind.LET)) {
                return variableDeclarationStatement();
            }

            try {
                return expression();
            } catch(e: unknown) {
                handleError(e, { recoverTo: [ TokenKind.LET, TokenKind.CLOSE_BRACKETS, ...EXPRESSION_TOKENS ] });
                return EMPTY_EXPRESSION;
            }
        };

        const variableDeclarationStatement = () => {
            reader.consume(TokenKind.LET);

            const identifier = reader
                .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                .orElseMap(() => {
                    handleError(new ParsingError('Expected identifier after let keyword.'));
                    return EMPTY_IDENTIFIER_TOKEN;
                });

            reader.consume(TokenKind.EQUAL).ifEmpty(() => handleError(new ParsingError('Expected = after identifier.')));

            return variableDeclaration(identifier);
        };

        const functionDeclaration = (identifier: StringLiteralToken) => {
            reader.consume(TokenKind.OPEN_PARENTHESIS).ifEmpty(() => handleError(new ParsingError('Expected ( after = keyword in function declaration.')));
            const args = functionArguments();
            reader.consume(TokenKind.CLOSE_PARENTHESIS).ifEmpty(() => handleError(new ParsingError('Expected ) after typed arguments in function declaration.')));

            reader.consume(TokenKind.ARROW).ifEmpty(() => handleError(new ParsingError('Expected -> after arguments in function declaration.')));
            const type = reader
                .consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE)
                .orElseMap(() => {
                    handleError(new ParsingError('Expected type after arrow in function declaration.'));
                    return EMPTY_TOKEN;
                });

            reader.consume(TokenKind.OPEN_BRACKETS).ifEmpty(() => handleError(new ParsingError('Expected { after type in function declaration.')));
            const body = functionBody();
            reader.consume(TokenKind.CLOSE_BRACKETS).ifEmpty(() => handleError(new ParsingError('Expected } after body in function declaration.')));

            return AstBuilder.functionDeclaration({
                identifier: AstBuilder.identifier({ value: identifier.literal }),
                args,
                type: AstBuilder.identifier({ value: type.lexeme }),
                statements: body
            });
        };

        const functionArguments = () => {
            const args: TypedIdentifier[] = [];

            while(!reader.currentIs(TokenKind.CLOSE_PARENTHESIS)) {
                if(args.length) {
                    reader.consume(TokenKind.COMA).ifEmpty(() => handleError(new ParsingError('Arguments needs to be separated by a coma.')));
                }

                const identifier = reader
                    .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                    .orElseMap(() => {
                        new ParsingError('Arguments needs an identifier before colon and type.');
                        return EMPTY_IDENTIFIER_TOKEN;
                    });

                reader.consume(TokenKind.COLON).ifEmpty(() => handleError(new ParsingError('Arguments needs a colon after identifier and type.')));

                const type = reader
                    .consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE)
                    .orElseMap(() => {
                        new ParsingError('Arguments needs a type after colon.');
                        return EMPTY_TOKEN;
                    });

                args.push(AstBuilder.typedIdentifier({ value: identifier.literal, type: type.lexeme }));
            }

            return args;
        };

        const functionBody = () => {
            const statements: Statement[] = [];

            while(!reader.currentIs(TokenKind.CLOSE_BRACKETS)) {
                statements.push(statement());
            }

            return statements;
        };

        const variableDeclaration = (identifier: StringLiteralToken) => {
            let expr: Expression;

            try {
                expr = expression();
            } catch(e: unknown) {
                handleError(e);
                expr = EMPTY_EXPRESSION;
            }

            return AstBuilder.variableDeclaration({ identifier: AstBuilder.identifier({ value: identifier.literal}), expression: expr });
        };

        const expression = (): Expression => {
            let left = comparison();

            while(reader.currentIs(TokenKind.BANG_EQUAL, TokenKind.EQUAL_EQUAL)) {
                const operator = reader.consume(TokenKind.BANG_EQUAL, TokenKind.EQUAL_EQUAL)
                    .map((value) => binaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected == or != operator at start of equality.'));

                const right = comparison();
                left = AstBuilder.binaryExpression({ left, operator, right });
            }

            return left;
        };

        const comparison = (): Expression => {
            let left = addition();

            while(reader.currentIs(TokenKind.GREATER_THAN, TokenKind.GREATER_EQUAL, TokenKind.LESS_THAN, TokenKind.LESS_EQUAL)) {
                const operator = reader.consume(TokenKind.GREATER_THAN, TokenKind.GREATER_EQUAL, TokenKind.LESS_THAN, TokenKind.LESS_EQUAL)
                    .map((value) => binaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected <, <=, > or >= operator at start of comparison.'));

                const right = addition();
                left = AstBuilder.binaryExpression({ left, operator, right });
            }

            return left;
        };

        const addition = (): Expression => {
            let left = multiplication();

            while(reader.currentIs(TokenKind.MINUS, TokenKind.PLUS)) {
                const operator = reader.consume(TokenKind.MINUS, TokenKind.PLUS)
                    .map((value) => binaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected + or - operator at start of addition.'));

                const right = multiplication();
                left = AstBuilder.binaryExpression({ left, operator, right });
            }

            return left;
        };

        const multiplication = (): Expression => {
            let left = unary();

            while(reader.currentIs(TokenKind.SLASH, TokenKind.STAR)) {
                const operator = reader.consume(TokenKind.SLASH, TokenKind.STAR)
                    .map((value) => binaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected / or * operator at start of multiplication.'));

                const right = unary();
                left = AstBuilder.binaryExpression({ left, operator, right });
            }

            return left;
        };

        const unary = (): Expression => {
            if(reader.currentIs(TokenKind.MINUS, TokenKind.BANG, TokenKind.PLUS)) {
                const operator = reader.consume(TokenKind.MINUS, TokenKind.BANG, TokenKind.PLUS)
                    .map((value) => unaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected -, ! or + operator at start of unary.'));

                const right = unary();
                return AstBuilder.unaryExpression({ operator, expression: right });
            }

            return primary();
        };

        const primary = (): Expression => {
            if(reader.currentIs(TokenKind.INT)) {
                const int = reader
                    .consume(TokenKind.INT).unguard(numberLiteralToken)
                    .orElseThrow(new ParsingError('Expected int as int literal primary.'));

                return AstBuilder.intLiteral({ int: int.literal });
            }

            if(reader.currentIs(TokenKind.FLOAT)) {
                const float = reader
                    .consume(TokenKind.FLOAT).unguard(numberLiteralToken)
                    .orElseThrow(new ParsingError('Expected float as float literal primary.'));

                return AstBuilder.floatLiteral({ float: float.literal });
            }

            if(reader.currentIs(TokenKind.BOOLEAN)) {
                const boolean = reader
                    .consume(TokenKind.BOOLEAN).unguard(booleanLiteralToken)
                    .orElseThrow(new ParsingError('Expected boolean as boolean literal primary.'));

                return AstBuilder.booleanLiteral({ bool: boolean.literal });
            }

            if(reader.currentIs(TokenKind.IDENTIFIER)) {
                const identifier = reader
                    .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                    .orElseThrow(new ParsingError('Expected identifier as accessor.'));

                return AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: identifier.literal }) });
            }

            throw new ParsingError('Expected a float, int, boolean or identifier as a primary.');
        };

        const recover = (...kinds: TokenKind[]) => {
            reader.advance();

            while(!reader.currentIs(...kinds) && !reader.isAtEnd()) {
                reader.advance();
            }
        };

        const handleError = (error: unknown, options?: ErrorHandlingOptions) => {
            if(!isParsingError(error)) {
                throw error;
            }

            reporter.emit({ category: DiagnosticCategory.ERROR, message: error.message });

            if(options && options.recoverTo) {
                recover(...options.recoverTo);
            }
        };

        const nodes: TopLevelDeclaration[] = [];
        while(!reader.isAtEnd()) {
            const node = topLevelDeclaration();
            nodes.push(node);
        }

        if(reporter.errored()) {
            reporter.report();
            throw new Error('Errors were encountered while parsing program.');
        }

        return AstBuilder.source({ declarations: nodes });
    };

    return {
        parse
    };
};