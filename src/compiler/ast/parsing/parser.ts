import type { DiagnosticReporterFactory } from "../../../diagnostic/reporter";
import { DiagnosticCategory } from "../../../diagnostic/reporter";
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
import type { TokenReaderFactory } from "../../token/reader";
import type { AstOptimizerFactory } from "./optimization/optimizer";
import type { Declaration } from "../nodes/declarations/declaration";

interface Parser {
    parse: (tokens: Token[]) => Source
}

interface ErrorHandlingOptions {
    recoverAfter?: TokenKind[]
}

type ParserFactoryProps = {
    createTokenReader: TokenReaderFactory,
    createDiagnosticReporter: DiagnosticReporterFactory,
    createAstOptimizer: AstOptimizerFactory
}

type ParserFactory = (factoryProps: ParserFactoryProps) => Parser

export const createParser: ParserFactory = ({ createTokenReader, createDiagnosticReporter, createAstOptimizer }) => {

    const EMPTY_IDENTIFIER = AstBuilder.identifier({ value: '' });
    const EMPTY_EXPRESSION = AstBuilder.accessor({ identifier: EMPTY_IDENTIFIER });
    const EMPTY_DECLARATION = AstBuilder.variableDeclaration({ identifier: EMPTY_IDENTIFIER, expression: EMPTY_EXPRESSION });

    const parse = (tokens: Token[]): Source => {
        const reader = createTokenReader({ tokens });
        const reporter = createDiagnosticReporter();
        const optimizer = createAstOptimizer();

        const topLevelDeclaration = (): TopLevelDeclaration => {
            try {
                if(reader.consume(TokenKind.EXPORT).isPresent()) {
                    return AstBuilder.exportation({ declaration: declaration() });
                }

                if(reader.currentIs(TokenKind.IDENTIFIER)) {
                    return declaration();
                }

                return expression();
            } catch(e: unknown) {
                handleError(e, { recoverAfter: [ TokenKind.SEMICOLON ] });
                return EMPTY_EXPRESSION;
            }
        };

        const declaration = () => {
            const identifier = reader
                .consume(TokenKind.IDENTIFIER)
                .unguard(stringLiteralToken)
                .orElseThrow(new ParsingError('Expected identifier at the start of a declaration.'));

            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError('Expected = after identifier.'));

            let declaration: Declaration = EMPTY_DECLARATION;

            if(reader.currentIs(TokenKind.FUN)) {
                declaration = functionDeclaration(identifier);
            } else if(reader.currentIs(TokenKind.CONST)) {
                declaration = variableDeclaration(identifier);
            }

            reader.consume(TokenKind.SEMICOLON).orElseThrow(new ParsingError('Expected semicolon at end of variable declaration.'));
            return declaration;
        };

        const statement = () => {
            try {
                if(reader.currentIs(TokenKind.IDENTIFIER)) {
                    if(reader.lookupForUntil(TokenKind.EQUAL, (token) => token.kind === TokenKind.CONST)) {
                        return variableDeclarationStatement();
                    }
                }

                return expression();
            } catch(e: unknown) {
                handleError(e, { recoverAfter: [ TokenKind.SEMICOLON ] });
                return EMPTY_EXPRESSION;
            }
        };

        const variableDeclarationStatement = () => {
            const identifier = reader
                .consume(TokenKind.IDENTIFIER)
                .unguard(stringLiteralToken)
                .orElseThrow(new Error('Tried to create a variable declaration without an identifier.'));

            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError('Expected = after identifier.'));

            return variableDeclaration(identifier);
        };

        const functionDeclaration = (identifier: StringLiteralToken) => {
            reader.consume(TokenKind.FUN).orElseThrow(new Error('Tried to create a function declaration without a fun keyword.'));

            reader.consume(TokenKind.OPEN_PARENTHESIS).orElseThrow(new ParsingError('Expected ( after = keyword in function declaration.'));
            const args = functionArguments();
            reader.consume(TokenKind.CLOSE_PARENTHESIS).orElseThrow(new ParsingError('Expected ) after typed arguments in function declaration.'));

            reader.consume(TokenKind.ARROW).orElseThrow(new ParsingError('Expected -> after arguments in function declaration.'));
            const type = reader
                .consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE)
                .orElseThrow(new ParsingError('Expected type after arrow in function declaration.'));

            const body = functionBody();

            return AstBuilder.functionDeclaration({
                identifier: AstBuilder.identifier({ value: identifier.literal }),
                args,
                type: AstBuilder.identifier({ value: type.lexeme }),
                statements: body
            });
        };

        const functionArguments = () => {
            const args: TypedIdentifier[] = [];

            while(!reader.currentIs(TokenKind.CLOSE_PARENTHESIS) && !reader.isAtEnd()) {
                if(args.length) {
                    reader.consume(TokenKind.COMA).orElseThrow(new ParsingError('Arguments needs to be separated by a coma.'));
                }

                const identifier = reader
                    .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                    .orElseThrow(new ParsingError('Arguments needs an identifier before colon and type.'));

                reader.consume(TokenKind.COLON).orElseThrow(new ParsingError('Arguments needs a colon after identifier and type.'));

                const type = reader
                    .consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE)
                    .orElseThrow(new ParsingError('Arguments needs a type after colon.'));

                args.push(AstBuilder.typedIdentifier({ value: identifier.literal, type: type.lexeme }));
            }

            return args;
        };

        const functionBody = () => {
            const statements: Statement[] = [];

            while(!reader.currentIs(TokenKind.SEMICOLON) && !reader.isAtEnd()) {
                statements.push(statement());
            }

            return statements;
        };

        const variableDeclaration = (identifier: StringLiteralToken) => {
            reader.consume(TokenKind.CONST).orElseThrow(new ParsingError('Expected variable declaration to be a constant.'));

            return AstBuilder.variableDeclaration({
                identifier: AstBuilder.identifier({ value: identifier.literal}),
                expression: expression()
            });
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

            if(reader.currentIs(TokenKind.OPEN_PARENTHESIS)) {
                reader.consume(TokenKind.OPEN_PARENTHESIS);
                const expr = expression();
                reader
                    .consume(TokenKind.CLOSE_PARENTHESIS)
                    .orElseThrow(new ParsingError('Expected ) after grouping expression.'));

                return AstBuilder.grouping({ expression: expr });
            }

            throw new ParsingError('Expected a float, int, boolean or identifier as a primary.');
        };

        const recover = (...kinds: TokenKind[]) => {
            reader.advance();

            while(!reader.currentIs(...kinds) && !reader.isAtEnd()) {
                reader.advance();
            }

            reader.advance();
        };

        const handleError = (error: unknown, options?: ErrorHandlingOptions) => {
            if(!isParsingError(error)) {
                throw error;
            }

            reporter.emit({ category: DiagnosticCategory.ERROR, message: error.message });

            if(options && options.recoverAfter) {
                recover(...options.recoverAfter);
            }
        };

        const nodes: TopLevelDeclaration[] = [];
        while(!reader.isAtEnd()) {
            const node = topLevelDeclaration();
            nodes.push(node);
        }

        if(reporter.errored()) {
            reporter.report();
            throw new Error('Parsing error.');
        }

        const source = AstBuilder.source({ declarations: nodes });
        return optimizer.optimize(source);
    };

    return {
        parse
    };
};