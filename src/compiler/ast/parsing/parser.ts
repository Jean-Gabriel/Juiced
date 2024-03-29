import type { DiagnosticReporterFactory } from "../../../diagnostic/reporter";
import { diagnostic } from "../../../diagnostic/reporter";
import type { Module, TopLevelDeclaration } from "../nodes/module";
import AstBuilder from "../nodes/builder";
import { TokenKind } from "../../token/kinds";
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
import { AstNodeKind } from "../nodes/node";
import { Type } from "../../typing/type";
import type { Parameter } from "../nodes/declarations/parameter";

interface Parser {
    parse: (tokens: Token[]) => Module
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

    const parse = (tokens: Token[]): Module => {
        const reader = createTokenReader({ tokens });
        const reporter = createDiagnosticReporter();
        const optimizer = createAstOptimizer();

        const topLevelDeclaration = (): TopLevelDeclaration => {
            try {
                let topLevel: TopLevelDeclaration;

                if(reader.consume(TokenKind.EXPORT).isPresent()) {
                    topLevel = AstBuilder.exportation({ declaration: declaration() });

                    if(topLevel.declaration.kind === AstNodeKind.FUNCTION_DECLARATION) {
                        return topLevel; // no semicolon required at the end of a function declaration
                    }
                } else if(reader.currentIs(TokenKind.IDENTIFIER)) {
                    topLevel = declaration();

                    if(topLevel.kind === AstNodeKind.FUNCTION_DECLARATION) {
                        return topLevel; // no semicolon required at the end of a function declaration
                    }
                } else {
                    topLevel = expression();
                }

                reader.consume(TokenKind.SEMICOLON).orElseThrow(new ParsingError(`Expected semicolon at end of top level expression on ${reader.current().lexeme} at line ${reader.current().line}.`));
                return topLevel;
            } catch(e: unknown) {
                handleError(e, { recoverAfter: [ TokenKind.SEMICOLON ] });
                return EMPTY_EXPRESSION;
            }
        };

        const declaration = () => {
            const identifier = reader
                .consume(TokenKind.IDENTIFIER)
                .unguard(stringLiteralToken)
                .orElseThrow(new ParsingError(`Expected identifier at the start of a declaration on ${reader.current().lexeme} at line ${reader.current().line}.`));

            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError(`Expected = after identifier ${identifier.literal} at line ${reader.current().line}.`));

            let declaration: Declaration;

            if(reader.currentIs(TokenKind.FUN)) {
                declaration = functionDeclaration(identifier);
            } else if(reader.currentIs(TokenKind.CONST)) {
                declaration = variableDeclaration(identifier);
            } else {
                throw new  ParsingError(`Expected declaration to be either a function or a variable on ${reader.current().lexeme} at line ${reader.current().line}.`);
            }

            return declaration;
        };

        const statement = () => {
            try {
                let statement: Statement;

                if(reader.currentIs(TokenKind.IDENTIFIER)) {
                    if(reader.lookupForUntil(TokenKind.EQUAL, (token) => token.kind === TokenKind.SEMICOLON)) {
                        statement = variableDeclarationStatement();
                    } else {
                        statement = expression();
                    }
                } else {
                    statement = expression();
                }

                reader.consume(TokenKind.SEMICOLON).orElseThrow(new ParsingError(`Expected semicolon at end of expression on ${reader.current().lexeme} at line ${reader.current().line}.`));
                return statement;
            } catch(e: unknown) {
                handleError(e, { recoverAfter: [ TokenKind.SEMICOLON, TokenKind.CLOSE_BRACKETS ] });
                return EMPTY_EXPRESSION;
            }
        };

        const variableDeclarationStatement = () => {
            const identifier = reader
                .consume(TokenKind.IDENTIFIER)
                .unguard(stringLiteralToken)
                .orElseThrow(new Error('Tried to create a variable declaration without an identifier.'));

            reader
                .consume(TokenKind.EQUAL)
                .orElseThrow(new ParsingError(`Expected = after identifier ${identifier.literal} at line ${reader.current().line}.`));

            return variableDeclaration(identifier);
        };

        const functionDeclaration = (identifier: StringLiteralToken) => {
            reader.consume(TokenKind.FUN).orElseThrow(new Error('Tried to create a function declaration without a fun keyword.'));

            reader.consume(TokenKind.OPEN_PARENTHESIS).orElseThrow(new ParsingError(`Expected ( after = keyword in function declaration ${identifier.literal} at line ${reader.current().line}.`));
            const args = functionArguments();
            reader.consume(TokenKind.CLOSE_PARENTHESIS).orElseThrow(new ParsingError(`Expected ) after typed arguments in function declaration ${identifier.literal} at line ${reader.current().line}.`));

            reader.consume(TokenKind.COLON).orElseThrow(new ParsingError(`Expected : after arguments in function declaration ${identifier.literal} at line ${reader.current().line}.`));
            const type = reader
                .consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE)
                .orElseThrow(new ParsingError(`Expected type after arrow in function declaration ${identifier.literal} at line ${reader.current().line}.`));

            const body = functionBody();

            return AstBuilder.functionDeclaration({
                identifier: AstBuilder.identifier({ value: identifier.literal }),
                args,
                type: Type.from(type.lexeme),
                body: body
            });
        };

        const functionArguments = () => {
            const args: Parameter[] = [];

            while(!reader.currentIs(TokenKind.CLOSE_PARENTHESIS) && !reader.isAtEnd()) {
                if(args.length) {
                    reader.consume(TokenKind.COMA).orElseThrow(new ParsingError(`Expected arguments needs to be separated by a coma on ${reader.current().lexeme} at line ${reader.current().line}.`));
                }

                const identifier = reader
                    .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                    .orElseThrow(new ParsingError(`Exprected arguments to have an identifier before colon and type on ${reader.current().lexeme} at line ${reader.current().line}.`));

                reader
                    .consume(TokenKind.COLON)
                    .orElseThrow(new ParsingError(`Expected argument ${identifier.literal} to have a colon between identifier and type on ${reader.current().lexeme} at line ${reader.current().line}.`));

                const type = reader
                    .consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE)
                    .orElseThrow(new ParsingError(`Expected arguments ${identifier.literal} to have a type after colon ${reader.current().line}.`));


                const argument = AstBuilder.functionArgument({
                    identifier: AstBuilder.identifier({ value: identifier.literal }),
                    type: Type.from(type.lexeme)
                });

                args.push(argument);
            }

            return args;
        };

        const functionBody = () => {
            const statements: Statement[] = [];

            reader.consume(TokenKind.OPEN_BRACKETS).orElseThrow(new ParsingError(`Expected { at start of function body on ${reader.current().lexeme} at line ${reader.current().line}.`));

            while(!reader.currentIs(TokenKind.CLOSE_BRACKETS) && !reader.isAtEnd()) {
                statements.push(statement());
            }

            reader.consume(TokenKind.CLOSE_BRACKETS).orElseThrow(new ParsingError(`Expected } at end of function body on ${reader.current().lexeme} at line ${reader.current().line}.`));

            return statements;
        };

        const variableDeclaration = (identifier: StringLiteralToken) => {
            reader.consume(TokenKind.CONST).orElseThrow(new ParsingError(`Expected variable declaration ${identifier.literal} to be a constant at line ${reader.current().line}.`));

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
                    .orElseThrow(new ParsingError(`Expected == or != operator at start of equality on ${reader.current().lexeme} at line ${reader.current().line}.`));

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
                    .orElseThrow(new ParsingError(`Expected <, <=, > or >= operator at start of comparison on ${reader.current().lexeme} at line ${reader.current().line}.`));

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
                    .orElseThrow(new ParsingError(`Expected + or - operator at start of addition on ${reader.current().lexeme} at line ${reader.current().line}.`));

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
                    .orElseThrow(new ParsingError(`Expected / or * operator at start of multiplication on ${reader.current().lexeme} at line ${reader.current().line}.`));

                const right = unary();
                left = AstBuilder.binaryExpression({ left, operator, right });
            }

            return left;
        };

        const unary = (): Expression => {
            if(reader.currentIs(TokenKind.MINUS, TokenKind.BANG, TokenKind.PLUS)) {
                const operator = reader.consume(TokenKind.MINUS, TokenKind.BANG, TokenKind.PLUS)
                    .map((value) => unaryOperators.get(value.kind))
                    .orElseThrow(new ParsingError(`Expected -, ! or + operator at start of unary on ${reader.current().lexeme} at line ${reader.current().line}.`));

                const right = unary();
                return AstBuilder.unaryExpression({ operator, expression: right });
            }

            return primary();
        };

        const primary = (): Expression => {
            if(reader.currentIs(TokenKind.INT)) {
                const int = reader
                    .consume(TokenKind.INT).unguard(numberLiteralToken)
                    .orElseThrow(new ParsingError(`Expected int as int literal primary on ${reader.current().lexeme} at line ${reader.current().line}.`));

                return AstBuilder.intLiteral({ int: int.literal });
            }

            if(reader.currentIs(TokenKind.FLOAT)) {
                const float = reader
                    .consume(TokenKind.FLOAT).unguard(numberLiteralToken)
                    .orElseThrow(new ParsingError(`Expected float as float literal primary on ${reader.current().lexeme} at line ${reader.current().line}.`));

                return AstBuilder.floatLiteral({ float: float.literal });
            }

            if(reader.currentIs(TokenKind.BOOLEAN)) {
                const boolean = reader
                    .consume(TokenKind.BOOLEAN).unguard(booleanLiteralToken)
                    .orElseThrow(new ParsingError(`Expected boolean as boolean literal primary on ${reader.current().lexeme} at line ${reader.current().line}.`));

                return AstBuilder.booleanLiteral({ bool: boolean.literal });
            }

            if(reader.currentIs(TokenKind.IDENTIFIER)) {
                const identifier = reader
                    .consume(TokenKind.IDENTIFIER).unguard(stringLiteralToken)
                    .orElseThrow(new ParsingError(`Expected identifier as accessor on ${reader.current().lexeme} at line ${reader.current().line}.`));

                if(reader.consume(TokenKind.OPEN_PARENTHESIS).isPresent()) {
                    const parameters = invocationParameters();

                    reader
                        .consume(TokenKind.CLOSE_PARENTHESIS)
                        .orElseThrow(new ParsingError(`Expected ) at the end of invocation ${identifier.literal} at line ${reader.current().line}.`));

                    return AstBuilder.invocation({ invoked: AstBuilder.identifier({ value: identifier.literal }), parameters });
                }
                return AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: identifier.literal }) });
            }

            if(reader.currentIs(TokenKind.OPEN_PARENTHESIS)) {
                reader.consume(TokenKind.OPEN_PARENTHESIS);
                const expr = expression();
                reader
                    .consume(TokenKind.CLOSE_PARENTHESIS)
                    .orElseThrow(new ParsingError(`Expected ) after grouping expression on ${reader.current().lexeme} at line ${reader.current().line}.`));

                return AstBuilder.grouping({ expression: expr });
            }

            throw new ParsingError(`Expected a float, int, boolean or identifier as a primary on ${reader.current().lexeme} at line ${reader.current().line}.`);
        };

        const invocationParameters = () => {
            const parameters: Expression[] = [];

            while(!reader.currentIs(TokenKind.CLOSE_PARENTHESIS) && !reader.isAtEnd()) {
                if(!reader.consume(TokenKind.COMA).isPresent() && parameters.length) {
                    throw new ParsingError(`Expected invocation parameters to be seperated by a coma on ${reader.current().lexeme} at line ${reader.current().line}.`);
                }

                parameters.push(expression());
            }

            return parameters;
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

            reporter.emit(diagnostic.error(error.message));

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

        const module = AstBuilder.module({ declarations: nodes });
        return optimizer.optimize(module);
    };

    return {
        parse
    };
};