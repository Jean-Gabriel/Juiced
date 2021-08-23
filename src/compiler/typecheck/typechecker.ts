import type { DiagnosticReporter } from "../../diagnostic/reporter";
import type { FunctionDeclaration } from "../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../ast/nodes/declarations/variable";
import type { BinaryExpression } from "../ast/nodes/expressions/binary";
import type { Expression } from "../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../ast/nodes/expressions/grouping";
import { OperatorKind } from "../ast/nodes/expressions/operators";
import type { UnaryExpression } from "../ast/nodes/expressions/unary";
import { AstNodeKind } from "../ast/nodes/node";
import type { Source } from "../ast/nodes/source";
import MemberBuilder from "./members/builder";
import { Scope } from "./scope";

interface Typechecker {
    check: () => void
}

type TypecheckerProps = {
    source: Source,
    createDiagnosticReporter: () => DiagnosticReporter
}

type InferedType = string

//TODO: Use diagnostic reporter
export const createTypechecker = ({ source, createDiagnosticReporter }: TypecheckerProps): Typechecker => {

    const BOOLEAN_OPERATORS = [
        OperatorKind.EQUAL_EQUAL,
        OperatorKind.NOT_EQUAL,
        OperatorKind.GREATER_EQUAL,
        OperatorKind.GREATER_THAN,
        OperatorKind.LESS_THAN,
        OperatorKind.LESS_EQUAL
    ];

    const NUMBER_OPERATORS = [
        ...BOOLEAN_OPERATORS,
        OperatorKind.DIVISION,
        OperatorKind.MINUS,
        OperatorKind.MULTIPLICATION,
        OperatorKind.PLUS
    ];

    const check = () => {
        const reporter = createDiagnosticReporter();
        let scope = Scope.empty();

        const grouping = (grouping: GroupingExpression): InferedType => {
            return expression(grouping.expression);
        };

        const binary = (binary: BinaryExpression): InferedType => {
            const right = expression(binary.right);
            const left = expression(binary.left);

            if(right != left) {
                throw Error('Both sides of binary operation must have the same type.');
            }

            const type = right;
            if(type === 'bool') {
                if(!BOOLEAN_OPERATORS.includes(binary.operator)) {
                    throw Error('Invalid bool operator.');
                }

                return type;
            }

            if(type === 'i32' || type === 'f32') {
                if(!NUMBER_OPERATORS.includes(binary.operator)) {
                    throw Error('Invalid i32 or f32 operator.');
                }

                if(BOOLEAN_OPERATORS.includes(binary.operator)) {
                    return 'bool';
                }

                return type;
            }

            throw Error('Invalid binary expression.');
        };

        const unary = (unary: UnaryExpression): InferedType => {
            const type = expression(unary.expression);

            if(unary.operator === OperatorKind.MINUS || unary.operator === OperatorKind.PLUS) {
                if(type != 'i32' && type != 'f32') {
                    throw new Error('Minus unary must affect an i32 or f32.');
                }

                return type;
            }

            if(unary.operator === OperatorKind.NOT) {
                if(type != 'bool') {
                    throw new Error('Minus unary must affect a bool.');
                }

                return type;
            }

            throw new Error('Invalid unary expression.');
        };

        //TODO: pass types from token to ast to prevent duplicating type
        const expression = (expression: Expression): InferedType => {
            if(expression.kind === AstNodeKind.INT_LITERAL) {
                return 'i32';
            }

            if(expression.kind === AstNodeKind.FLOAT_LITERAL) {
                return 'f32';
            }

            if(expression.kind === AstNodeKind.BOOLEAN_LITERAL) {
                return 'bool';
            }

            if(expression.kind === AstNodeKind.ACCESSOR) {
                const member = scope.lookup(expression.identifier.value);
                if(!member) {
                    throw Error('Trying to access not declared variable.');
                }

                return member.type;
            }

            if(expression.kind === AstNodeKind.UNARY) {
                return unary(expression);
            }

            if(expression.kind === AstNodeKind.BINARY) {
                return binary(expression);
            }

            if(expression.kind === AstNodeKind.GROUPING) {
                return grouping(expression);
            }

            throw new Error('Invalid binary operation');
        };

        const variableDeclaration = (variable: VariableDeclaration)  => {
            const inferedType = expression(variable.expression);
            scope.add(MemberBuilder.variable(variable, inferedType));
        };

        const functionDeclaration = (fun: FunctionDeclaration) => {
            scope = scope.push();

            fun.arguments.forEach(arg => scope.add(MemberBuilder.typedIdentifier(arg)));

            fun.body.forEach((statement, index) => {
                if(statement.kind === AstNodeKind.VARIABLE_DECLARATION) {
                    if(index === fun.body.length - 1) {
                        throw new Error('A function cannot return a variable declaration.');
                    }

                    return variableDeclaration(statement);
                }

                const infered = expression(statement);
                if(infered != fun.type.value) {
                    throw new Error('Function does not return expected type.');
                }
            });

            scope = scope.pop();
        };

        const module = (source: Source) => {
            const functions: FunctionDeclaration[] = [];

            source.declarations.forEach(topLevelDeclaration => {
                if(topLevelDeclaration.kind === AstNodeKind.EXPORT) {
                    const exported = topLevelDeclaration.declaration;

                    if(exported.kind === AstNodeKind.FUNCTION_DECLARATION) {
                        functions.push(exported);
                        scope.add(MemberBuilder.functionMember(exported));
                    }

                    if(exported.kind === AstNodeKind.VARIABLE_DECLARATION) {
                        variableDeclaration(exported);
                    }
                }
            });

            functions.forEach(functionDeclaration);
        };

        module(source);
    };

    return {
        check
    };
};