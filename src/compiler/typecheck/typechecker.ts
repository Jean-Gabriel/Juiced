import type { DiagnosticReporterFactory } from "../../diagnostic/reporter";
import { DiagnosticCategory } from "../../diagnostic/reporter";
import type { FunctionDeclaration } from "../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../ast/nodes/declarations/variable";
import type { BinaryExpression } from "../ast/nodes/expressions/binary";
import type { Expression } from "../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../ast/nodes/expressions/grouping";
import type { Invocation } from "../ast/nodes/expressions/invocation";
import { OperatorKind } from "../ast/nodes/expressions/operators";
import type { UnaryExpression } from "../ast/nodes/expressions/unary";
import { AstNodeKind } from "../ast/nodes/node";
import type { Module } from "../ast/nodes/module";
import { moduleDeclarationsOf } from "./declarations/module";
import { isTypecheckingError, TypecheckingError } from "./error";
import SymbolsBuilder from "./symbols/builder";
import { SymbolKind } from "./symbols/symbol";
import { Scope } from "./scope";
import { Primitive, Type } from "../typing/type";

interface Typechecker {
    run: (module: Module) => void
}

type TypecheckerFactoryProps = {
    createDiagnosticReporter: DiagnosticReporterFactory
}

type TypecheckerFactory = (factoryProps: TypecheckerFactoryProps) => Typechecker

export const createTypechecker: TypecheckerFactory = ({ createDiagnosticReporter }) => {

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

    const run = (module: Module) => {
        const reporter = createDiagnosticReporter();
        let scope = Scope.empty();

        const invocation = (invocation: Invocation): Type => {
            const found = scope.lookup(invocation.invoked.value);

            if(!found) {
                throw new TypecheckingError('Trying to access not declared function.');
            }

            if(found.kind !== SymbolKind.FUNCTION) {
                throw new TypecheckingError('Only functions can be invoked.');
            }

            if(found.args.length !== invocation.parameters.length) {
                throw new TypecheckingError('Function was invoked with more parameters than it has arguments.');
            }

            invocation.parameters.forEach((param, index) => {
                const type = expression(param);
                const argument = found.args[index];

                if(!argument.type.isSame(type)) {
                    throw new TypecheckingError('Function argument was invoked with expression of the wrong type.');
                }
            });

            return found.type;
        };

        const grouping = (grouping: GroupingExpression): Type => {
            return expression(grouping.expression);
        };

        const binary = (binary: BinaryExpression): Type => {
            const right = expression(binary.right);
            const left = expression(binary.left);

            if(!right.isSame(left)) {
                throw new TypecheckingError('Both sides of binary operation must have the same type.');
            }

            const type = right;
            if(type.is(Primitive.BOOL)) {
                if(!BOOLEAN_OPERATORS.includes(binary.operator)) {
                    throw new TypecheckingError('Invalid bool operator.');
                }

                return type;
            }

            if(type.is(Primitive.I32) || type.is(Primitive.F32)) {
                if(!NUMBER_OPERATORS.includes(binary.operator)) {
                    throw new TypecheckingError('Invalid i32 or f32 operator.');
                }

                if(BOOLEAN_OPERATORS.includes(binary.operator)) {
                    return Type.from(Primitive.BOOL);
                }

                return type;
            }

            throw new TypecheckingError('Invalid binary expression.');
        };

        const unary = (unary: UnaryExpression): Type => {
            const type = expression(unary.expression);

            if(unary.operator === OperatorKind.MINUS || unary.operator === OperatorKind.PLUS) {
                if(type.is(Primitive.I32) && type.is(Primitive.F32)) {
                    throw new TypecheckingError('Minus unary must affect an i32 or f32.');
                }

                return type;
            }

            if(unary.operator === OperatorKind.NOT) {
                if(type.is(Primitive.BOOL)) {
                    throw new TypecheckingError('Minus unary must affect a bool.');
                }

                return type;
            }

            throw new TypecheckingError('Invalid unary expression.');
        };

        const expression = (expression: Expression): Type => {
            if(expression.kind === AstNodeKind.INT_LITERAL) {
                return Type.from(Primitive.I32);
            }

            if(expression.kind === AstNodeKind.FLOAT_LITERAL) {
                return Type.from(Primitive.F32);
            }

            if(expression.kind === AstNodeKind.BOOLEAN_LITERAL) {
                return Type.from(Primitive.BOOL);
            }

            if(expression.kind === AstNodeKind.ACCESSOR) {
                const symbol = scope.lookup(expression.identifier.value);
                if(!symbol) {
                    throw new TypecheckingError('Trying to access not declared variable.');
                }

                return symbol.type;
            }

            if(expression.kind === AstNodeKind.INVOCATION) {
                return invocation(expression);
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

            throw new TypecheckingError('Invalid binary operation');
        };

        const variableDeclaration = (variable: VariableDeclaration)  => {
            const inferedType = expression(variable.expression);
            scope.add(SymbolsBuilder.variableSymbol({ variable, type: inferedType }));
        };

        const functionDeclaration = (fun: FunctionDeclaration) => {
            scope = scope.push();

            fun.body.forEach((statement, index) => {
                if(statement.kind === AstNodeKind.VARIABLE_DECLARATION) {
                    if(index === fun.body.length - 1) {
                        throw new TypecheckingError('A function cannot return a variable declaration.');
                    }

                    return variableDeclaration(statement);
                }

                const type = expression(statement);
                if(!type.isSame(fun.type)) {
                    throw new TypecheckingError('Function does not return expected type.');
                }
            });

            scope = scope.pop();
        };

        const resolve = (module: Module) => {
            const declarations = moduleDeclarationsOf(module);

            declarations.functions.forEach(fun => {
                scope.add(SymbolsBuilder.functionSymbol({ fun }));
            });

            declarations.variables.forEach(variable => {
                variableDeclaration(variable);
            });

            declarations.functions.forEach(functionDeclaration);
        };

        const handleError = (error: unknown) => {
            if(!isTypecheckingError(error)) {
                throw error;
            }

            reporter.emit({ category: DiagnosticCategory.ERROR, message: error.message });
        };

        try {
            resolve(module);
        } catch(e) {
            handleError(e);
        }

        if(reporter.errored()) {
            reporter.report();
            throw Error('Typechecking error.');
        }
    };

    return {
        run
    };
};