import type { DiagnosticReporter } from "../../../diagnostic/reporter";
import type TokenReader from "../../token/reader";
import type { DeclarationNode } from "../nodes/declarations/declaration";
import type { Program } from "../nodes/program";
import AstBuilder from "../nodes/builder";
import { TokenKind } from "../../token/kinds";
import type { TypedIdentifier } from "../nodes/identifier";
import type { Statement } from "../nodes/statements/statement";
import type { Token } from "../../token/token";

interface Parser {
    parse: () => Program
}

const createParser = (
    createTokenReader: () => TokenReader,
    createDiagnosticReporter: () => DiagnosticReporter
): Parser => {

    const parse = (): Program => {
        const reader = createTokenReader();
        const reporter = createDiagnosticReporter();

        const topLevelDeclaration = () => {
            const current = reader.current();
            if(current.kind === TokenKind.EXPORT) {
                return exportDeclaration();
            }

            return expression();
        };

        const exportDeclaration = () => {
            reader.consume(TokenKind.EXPORT).orElseThrow(new ParsingError('Expected export keyword at start of export declaration.'));
            return declaration();
        };

        const declaration = () => {
            reader.consume(TokenKind.LET).orElseThrow(new ParsingError('Expected declaration after export keyword.'));
            const identifier = reader.consume(TokenKind.IDENTIFIER).orElseThrow(new ParsingError('Expected identifier after let keyword.'));
            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError('Expected = after identifier.'));

            const current = reader.current();
            if(current.kind === TokenKind.OPEN_PARENTHESIS) {
                return functionDeclaration(identifier);
            }

            return variableDeclaration();
        };

        const statement = () => {

        };

        const variableDeclarationStatement = () => {
            reader.consume(TokenKind.LET).orElseThrow(new ParsingError('Expected let after for variable declaration.'));
            reader.consume(TokenKind.IDENTIFIER).orElseThrow(new ParsingError('Expected identifier after let keyword.'));
            reader.consume(TokenKind.EQUAL).orElseThrow(new ParsingError('Expected = after identifier.'));
            return variableDeclaration();
        };

        const functionDeclaration = (identifier: Token) => {
            reader.consume(TokenKind.OPEN_PARENTHESIS).orElseThrow(new ParsingError('Expected ( after = keyword in function declaration.'));
            const args = functionArguments();
            reader.consume(TokenKind.CLOSE_PARENTHESIS).orElseThrow(new ParsingError('Expected ) after typed arguments in function declaration.'));

            reader.consume(TokenKind.ARROW).orElseThrow(new ParsingError('Expected -> after arguments in function declaration.'));
            const type = reader.consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE).orElseThrow(new ParsingError('Expected type after arrow in function declaration.'));

            reader.consume(TokenKind.OPEN_BRACKETS).orElseThrow(new ParsingError('Expected { after type in function declaration.'));
            const body = functionBody();
            reader.consume(TokenKind.CLOSE_BRACKETS).orElseThrow(new ParsingError('Expected } after body in function declaration.'));

            return AstBuilder.functionDeclaration(AstBuilder.identifier(identifier.lexeme), args, AstBuilder.identifier(type.lexeme), body);
        };

        const variableDeclaration = () => {
            return expression();
        };

        const expression = () => {

        };

        const functionArguments = () => {
            const args: TypedIdentifier[] = [];

            while(reader.current().kind !== TokenKind.CLOSE_PARENTHESIS) {
                if(args.length) {
                    reader.consume(TokenKind.COMA).orElseThrow(new ParsingError('Arguments needs to be separated by a coma.'));
                }

                const identifier = reader.consume(TokenKind.IDENTIFIER).orElseThrow(new ParsingError('Arguments needs an identifier before colon and type.'));
                reader.consume(TokenKind.COLON).orElseThrow(new ParsingError('Arguments needs a colon after identifier and type.'));
                const type = reader.consume(TokenKind.INT_TYPE, TokenKind.FLOAT_TYPE, TokenKind.BOOLEAN_TYPE).orElseThrow(new ParsingError('Arguments needs a type after colon.'));

                args.push(AstBuilder.typedIdentifier(identifier.lexeme, type.lexeme));
            }

            return args;
        };

        const functionBody = () => {
            const statements: Statement[] = [];

            while(reader.current().kind !== TokenKind.CLOSE_BRACKETS) {
                statements.push(statement());
            }

            return statements;
        };

        const nodes: DeclarationNode[] = [];
        while(!reader.isAtEnd()) {
            const node = topLevelDeclaration();
        }

        return AstBuilder.program(nodes);
    };

    return {
        parse
    };
};