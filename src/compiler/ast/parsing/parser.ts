import type { DiagnosticReporter } from "../../../diagnostic/reporter";
import { DiagnosticCategory } from "../../../diagnostic/reporter";
import type TokenReader from "../../token/reader";
import type { Program, TopLevelDeclaration } from "../nodes/program";
import AstBuilder from "../nodes/builder";
import { TokenKind } from "../../token/kinds";
import type { TypedIdentifier } from "../nodes/identifier";
import type { Statement } from "../nodes/statements/statement";
import type { StringLiteralToken } from "../../token/token";
import { booleanLiteralToken } from "../../token/token";
import { numberLiteralToken } from "../../token/token";
import { stringLiteralToken } from "../../token/token";
import { binaryOperators, unaryOperators } from "../nodes/expressions/operators";
import type { Expression } from "../nodes/expressions/expression";
import { isParsingError, ParsingError } from "./error";

interface Parser {
    parse: () => Program
}

export const createParser = (
    createTokenReader: () => TokenReader,
    createDiagnosticReporter: () => DiagnosticReporter
): Parser => {

    const parse = (): Program => {
        const reader = createTokenReader();
        const reporter = createDiagnosticReporter();

        const topLevelDeclaration = (): TopLevelDeclaration => {
            if(reader.currentIs(TokenKind.EXPORT)) {
                return exportDeclaration();
            }

            return expression();
        };

        const exportDeclaration = () => {
            reader.consume(TokenKind.EXPORT).orElseThrow(new ParsingError('Expected export keyword at start of export declaration.'));
            const exported = declaration();

            return AstBuilder.exportation(exported);
        };

        const declaration = () => {
            reader.consume(TokenKind.LET).orElseThrow(new ParsingError('Expected declaration after export keyword.'));
            const identifier = reader.consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken).orElseThrow(new ParsingError('Expected identifier after let keyword.'));
            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError('Expected = after identifier.'));

            if(reader.currentIs(TokenKind.OPEN_PARENTHESIS)) {
                return functionDeclaration(identifier);
            }

            return variableDeclaration(identifier);
        };

        const statement = () => {
            if(reader.currentIs(TokenKind.LET)) {
                return variableDeclarationStatement();
            }

            return expression();
        };

        const variableDeclarationStatement = () => {
            reader.consume(TokenKind.LET).orElseThrow(new ParsingError('Expected let after for variable declaration.'));
            const identifier = reader.consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken).orElseThrow(new ParsingError('Expected identifier after let keyword.'));
            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError('Expected = after identifier.'));

            return variableDeclaration(identifier);
        };

        const functionDeclaration = (identifier: StringLiteralToken) => {
            reader.consume(TokenKind.OPEN_PARENTHESIS).orElseThrow(new ParsingError('Expected ( after = keyword in function declaration.'));
            const args = functionArguments();
            reader.consume(TokenKind.CLOSE_PARENTHESIS).orElseThrow(new ParsingError('Expected ) after typed arguments in function declaration.'));

            reader.consume(TokenKind.ARROW).orElseThrow(new ParsingError('Expected -> after arguments in function declaration.'));
            const type = reader.consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE).orElseThrow(new ParsingError('Expected type after arrow in function declaration.'));

            reader.consume(TokenKind.OPEN_BRACKETS).orElseThrow(new ParsingError('Expected { after type in function declaration.'));
            const body = functionBody();
            reader.consume(TokenKind.CLOSE_BRACKETS).orElseThrow(new ParsingError('Expected } after body in function declaration.'));

            return AstBuilder.functionDeclaration(AstBuilder.identifier(identifier.literal), args, AstBuilder.identifier(type.lexeme), body);
        };

        const functionArguments = () => {
            const args: TypedIdentifier[] = [];

            while(!reader.currentIs(TokenKind.CLOSE_PARENTHESIS)) {
                if(args.length) {
                    reader.consume(TokenKind.COMA).orElseThrow(new ParsingError('Arguments needs to be separated by a coma.'));
                }

                const identifier = reader.consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken).orElseThrow(new ParsingError('Arguments needs an identifier before colon and type.'));
                reader.consume(TokenKind.COLON).orElseThrow(new ParsingError('Arguments needs a colon after identifier and type.'));
                const type = reader.consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE).orElseThrow(new ParsingError('Arguments needs a type after colon.'));

                args.push(AstBuilder.typedIdentifier(identifier.literal, type.lexeme));
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
            const expr = expression();

            return AstBuilder.variableDeclaration(AstBuilder.identifier(identifier.literal), expr);
        };

        const expression = (): Expression => {
            let left = comparison();

            while(reader.currentIs(TokenKind.BANG_EQUAL, TokenKind.EQUAL_EQUAL)) {
                const operator = reader.consume(TokenKind.BANG_EQUAL, TokenKind.EQUAL_EQUAL)
                    .map((value) => binaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected == or != operator at start of equality.'));

                const right = comparison();
                left = AstBuilder.binaryExpression(left, operator, right);
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
                left = AstBuilder.binaryExpression(left, operator, right);
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
                left = AstBuilder.binaryExpression(left, operator, right);
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
                left = AstBuilder.binaryExpression(left, operator, right);
            }

            return left;
        };

        const unary = (): Expression => {
            if(reader.currentIs(TokenKind.MINUS, TokenKind.BANG)) {
                const operator = reader.consume(TokenKind.MINUS, TokenKind.BANG)
                    .map((value) => unaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError('Expected - or + operator at start of unary.'));

                const right = unary();
                return AstBuilder.unaryExpression(operator, right);
            }

            return primary();
        };

        const primary = (): Expression => {
            if(reader.currentIs(TokenKind.INT)) {
                const int = reader.consume(TokenKind.INT)
                    .unguard(numberLiteralToken)
                    .orElseThrow(new ParsingError('Expected int as int literal primary.'));

                return AstBuilder.intLiteral(int.literal);
            }

            if(reader.currentIs(TokenKind.FLOAT)) {
                const float = reader.consume(TokenKind.FLOAT)
                    .unguard(numberLiteralToken)
                    .orElseThrow(new ParsingError('Expected float as float literal primary.'));

                return AstBuilder.floatLiteral(float.literal);
            }

            if(reader.currentIs(TokenKind.BOOLEAN)) {
                const boolean = reader.consume(TokenKind.BOOLEAN)
                    .unguard(booleanLiteralToken)
                    .orElseThrow(new ParsingError('Expected boolean as boolean literal primary.'));

                return AstBuilder.booleanLiteral(boolean.literal);
            }

            if(reader.currentIs(TokenKind.IDENTIFIER)) {
                const identifier = reader.consume(TokenKind.IDENTIFIER)
                    .unguard(stringLiteralToken)
                    .orElseThrow(new ParsingError('Expected identifier as accessor.'));

                return AstBuilder.accessor(AstBuilder.identifier(identifier.literal));
            }

            throw new ParsingError('Expected a float, int, boolean or identifier as a primary.');
        };

        const handleError = (error: unknown) => {
            if(!isParsingError(error)) {
                throw error;
            }

            reporter.emit({ category: DiagnosticCategory.ERROR, message: error.message });
        };

        const nodes: TopLevelDeclaration[] = [];
        while(!reader.isAtEnd()) {
            try {
                const node = topLevelDeclaration();
                nodes.push(node);
            } catch (e: unknown) {
                handleError(e);
                break; // do to recover after error
            }

        }

        if(reporter.errored()) {
            reporter.report();
            throw new Error('Errors were encountered while parsing program.');
        }

        return AstBuilder.program(nodes);
    };

    return {
        parse
    };
};