import type { DiagnosticReporterFactory } from "../../diagnostic/reporter";
import { DiagnosticCategory } from "../../diagnostic/reporter";
import type { FunctionArgument } from "../ast/nodes/declarations/arg";
import type { DeclarationVisitor } from "../ast/nodes/declarations/declaration";
import type { FunctionDeclaration } from "../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../ast/nodes/declarations/variable";
import type { Export } from "../ast/nodes/export";
import type { Accessor } from "../ast/nodes/expressions/accessor";
import type { BinaryExpression } from "../ast/nodes/expressions/binary";
import type { Expression, ExpressionVisitor } from "../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../ast/nodes/expressions/grouping";
import type { Invocation } from "../ast/nodes/expressions/invocation";
import type { BooleanLiteral, FloatLiteral, IntLiteral } from "../ast/nodes/expressions/literal";
import { OperatorKind } from "../ast/nodes/expressions/operators";
import type { UnaryExpression } from "../ast/nodes/expressions/unary";
import type { Module, ModuleVisitor } from "../ast/nodes/module";
import { AstNodeKind } from "../ast/nodes/node";
import type { StatementVisitor } from "../ast/nodes/statements/statement";
import { isTypeResolverError, TypeResolvingError } from "./error";
import { NodeResolver } from "./resolved/type";
import { ResolverScope } from "./scope";
import { Primitive, Type } from "./type";

interface TypeResolver {
    resolve: (module: Module) => void
}

type TypeResolverFactoryProps = {
    createDiagnosticReporter: DiagnosticReporterFactory
}

type TypeResolverFactory = (factoryProps: TypeResolverFactoryProps) => TypeResolver

export const createTypeResolver: TypeResolverFactory = ({ createDiagnosticReporter }) => {

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

    let reporter = createDiagnosticReporter();
    let scope = ResolverScope.empty();

    const reset = () => {
        reporter = createDiagnosticReporter();
        scope = ResolverScope.empty();
    };

    const invocation = (invocation: Invocation): Type => {
        const found = scope.lookup(invocation.invoked);

        if(!found) {
            throw new TypeResolvingError('Trying to access not declared function.');
        }

        if(found.declaration.kind !== AstNodeKind.FUNCTION_DECLARATION) {
            throw new TypeResolvingError('Only functions can be invoked.');
        }

        if(found.declaration.arguments.length !== invocation.parameters.length) {
            throw new TypeResolvingError('Function was invoked with more parameters than it has arguments.');
        }

        const args = found.declaration.arguments;
        invocation.parameters.forEach((param, index) => {
            const type = param.acceptExpressionVisitor(expressionVisitor);
            const argument = args[index];

            if(!argument.type.isSame(type)) {
                throw new TypeResolvingError('Function argument was invoked with expression of the wrong type.');
            }
        });

        return found.type;
    };

    const binary = (binary: BinaryExpression): Type => {
        const right = binary.right.acceptExpressionVisitor(expressionVisitor);
        const left = binary.left.acceptExpressionVisitor(expressionVisitor);

        if(!right.isSame(left)) {
            throw new TypeResolvingError('Both sides of binary operation must have the same type.');
        }

        const type = right;
        if(type.is(Primitive.BOOL)) {
            if(!BOOLEAN_OPERATORS.includes(binary.operator)) {
                throw new TypeResolvingError('Invalid bool operator.');
            }

            return type;
        }

        if(type.is(Primitive.I32) || type.is(Primitive.F32)) {
            if(!NUMBER_OPERATORS.includes(binary.operator)) {
                throw new TypeResolvingError('Invalid i32 or f32 operator.');
            }

            if(BOOLEAN_OPERATORS.includes(binary.operator)) {
                return Type.from(Primitive.BOOL);
            }

            return type;
        }

        throw new TypeResolvingError('Invalid binary expression.');
    };

    const unary = (unary: UnaryExpression): Type => {
        const type = unary.expression.acceptExpressionVisitor(expressionVisitor);

        if(unary.operator === OperatorKind.MINUS || unary.operator === OperatorKind.PLUS) {
            if(type.is(Primitive.I32) && type.is(Primitive.F32)) {
                throw new TypeResolvingError('Minus unary must affect an i32 or f32.');
            }

            return type;
        }

        if(unary.operator === OperatorKind.NOT) {
            if(type.is(Primitive.BOOL)) {
                throw new TypeResolvingError('Minus unary must affect a bool.');
            }

            return type;
        }

        throw new TypeResolvingError('Invalid unary expression.');
    };

    const expressionVisitor: ExpressionVisitor<Type> = {
        visitGroupingExpression: function (expression: GroupingExpression) {
            return expression.expression.acceptExpressionVisitor(expressionVisitor);
        },

        visitBinaryExpression: function (expression: BinaryExpression) {
            return binary(expression);
        },

        visitUnaryExpression: function (expression: UnaryExpression) {
            return unary(expression);
        },

        visitAccessor: function (expression: Accessor) {
            const symbol = scope.lookup(expression.identifier);
            if(!symbol) {
                throw new TypeResolvingError('Trying to access not declared variable.');
            }

            return symbol?.type;
        },

        visitInvocation: function (expression: Invocation) {
            return invocation(expression);
        },

        visitIntLiteral: function (expression: IntLiteral) {
            return Type.from(Primitive.I32);
        },

        visitFloatLiteral: function (expression: FloatLiteral) {
            return Type.from(Primitive.F32);
        },

        visitBooleanLiteral: function (expression: BooleanLiteral) {
            return Type.from(Primitive.BOOL);
        }
    };

    const statementVisitor: StatementVisitor<Type | void> = {
        visitVariableDeclaration: function (declaration: VariableDeclaration): void {
            const type = declaration.expression.acceptExpressionVisitor(expressionVisitor);
            if(!type) {
                return;
            }

            scope.add(NodeResolver.variable(declaration, type));
        },

        visitExpression: function (expression: Expression): Type | void {
            const type = expression.acceptExpressionVisitor(expressionVisitor);

            if(!type) {
                return;
            }

            return type;
        }
    };

    const declarationVisitor: DeclarationVisitor<void> = {
        visitFunctionDeclaration: function (declaration: FunctionDeclaration): void {
            scope = scope.push();

            declaration.arguments.forEach(arg => arg.acceptDeclarationVisitor(declarationVisitor));
            declaration.body.forEach((statement, index) => {
                const type = statement.acceptStatementVisitor(statementVisitor);

                if(!type) {
                    if(index === declaration.body.length - 1) {
                        throw new TypeResolvingError('A function must return an expression.');
                    }

                    return;
                }

                if(!type.isSame(declaration.type)) {
                    throw new TypeResolvingError('Function does not return expected type.');
                }
            });

            scope = scope.pop();
        },

        visitFunctionArgument: function (declaration: FunctionArgument): void {
            scope.add(NodeResolver.argument(declaration));
        },

        visitVariableDeclaration: function (declaration: VariableDeclaration): void {
            const type = declaration.expression.acceptExpressionVisitor(expressionVisitor);
            scope.add(NodeResolver.variable(declaration, type));
        }
    };

    const moduleVisitor: ModuleVisitor<void> = {
        visitModule: function (module: Module): void {
            const exports = module.declarations.filter((decl): decl is Export => decl.kind === AstNodeKind.EXPORT).map(exportation => exportation.declaration);

            const functions = [
                ...module.declarations.filter((decl): decl is FunctionDeclaration => decl.kind === AstNodeKind.FUNCTION_DECLARATION),
                ...exports.filter((decl): decl is FunctionDeclaration => decl.kind === AstNodeKind.FUNCTION_DECLARATION)
            ];
            const variables = [
                ...module.declarations.filter((decl): decl is VariableDeclaration => decl.kind === AstNodeKind.VARIABLE_DECLARATION),
                ...exports.filter((decl): decl is VariableDeclaration => decl.kind === AstNodeKind.VARIABLE_DECLARATION)
            ];

            functions.forEach(fun => scope.add(NodeResolver.fun(fun)));

            variables.forEach(variable => variable.acceptDeclarationVisitor(declarationVisitor));
            functions.forEach(fun => fun.acceptDeclarationVisitor(declarationVisitor));
        }
    };

    const handleError = (error: unknown) => {
        if(!isTypeResolverError(error)) {
            throw error;
        }

        reporter.emit({ category: DiagnosticCategory.ERROR, message: error.message });
    };

    const resolve = (module: Module) => {
        reset();

        try {
            module.acceptModuleVisitor(moduleVisitor);
        } catch(e: unknown) {
            handleError(e);
        }

        if(reporter.errored()) {
            reporter.report();
            throw Error('Typechecking error.');
        }
    };

    return {
        resolve
    };
};