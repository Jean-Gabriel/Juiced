import type { DiagnosticReporterFactory } from "../../diagnostic/reporter";
import { DiagnosticCategory } from "../../diagnostic/reporter";
import type { Parameter } from "../ast/nodes/declarations/parameter";
import type { Declaration, DeclarationVisitor } from "../ast/nodes/declarations/declaration";
import type { FunctionDeclaration } from "../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../ast/nodes/declarations/variable";
import type { Accessor } from "../ast/nodes/expressions/accessor";
import type { BinaryExpression } from "../ast/nodes/expressions/binary";
import type { Expression, ExpressionVisitor } from "../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../ast/nodes/expressions/grouping";
import type { Invocation } from "../ast/nodes/expressions/invocation";
import { OperatorKind } from "../ast/nodes/expressions/operators";
import type { UnaryExpression } from "../ast/nodes/expressions/unary";
import type { Module, ModuleVisitor } from "../ast/nodes/module";
import { AstNodeKind } from "../ast/nodes/node";
import type { StatementVisitor } from "../ast/nodes/statements/statement";
import { isTypeResolverError, TypeResolvingError } from "./error";
import { NodeResolver } from "./resolve/type";
import { Primitive, Type } from "./type";
import type { TypeContextFactory } from "./context";
import type { BooleanLiteral, FloatLiteral, IntLiteral } from "../ast/nodes/expressions/literal";

interface TypeResolver {
    resolve: (module: Module) => void
}

type TypeResolverFactoryProps = {
    createDiagnosticReporter: DiagnosticReporterFactory,
    createTypeContext: TypeContextFactory
}

type TypeResolverFactory = (factoryProps: TypeResolverFactoryProps) => TypeResolver

export const createTypeResolver: TypeResolverFactory = ({ createDiagnosticReporter, createTypeContext }) => {

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
    let context = createTypeContext();

    const reset = () => {
        reporter = createDiagnosticReporter();
        context = createTypeContext();
    };

    const declarationsOf = (module: Module): [VariableDeclaration[], FunctionDeclaration[]] => {
        const result = module.declarations.reduce((acc, decl) => {
            const declaration = (declaration: Declaration) => {
                if(declaration.kind === AstNodeKind.FUNCTION_DECLARATION) {
                    acc.functions = [...acc.functions, declaration];
                }

                if(declaration.kind === AstNodeKind.VARIABLE_DECLARATION) {
                    acc.variables = [...acc.variables, declaration];
                }
            };

            if(decl.kind === AstNodeKind.EXPORT) {
                declaration(decl.declaration);
            }

            if(decl.kind === AstNodeKind.FUNCTION_DECLARATION || decl.kind === AstNodeKind.VARIABLE_DECLARATION) {
                declaration(decl);
            }

            return acc;
        }, { functions: new Array<FunctionDeclaration>(), variables: new Array<VariableDeclaration>()});

        return [result.variables, result.functions];
    };

    const invocation = (invocation: Invocation): Type => {
        const found = context.lookup(invocation.invoked);

        if(!found) {
            throw new TypeResolvingError(`Trying to access not declared function [${invocation.invoked.value}].`);
        }

        if(found.node.kind !== AstNodeKind.FUNCTION_DECLARATION) {
            throw new TypeResolvingError(`Invoked [${found.node.identifier.value}] is not a function.`);
        }

        const args = found.node.arguments;
        if(args.length !== invocation.parameters.length) {
            throw new TypeResolvingError(`Function [${found.node.identifier.value}] was invoked with more parameters than it has arguments.`);
        }

        invocation.parameters.forEach((param, index) => {
            const type = param.acceptExpressionVisitor(expressionVisitor);
            const argument = args[index];

            if(!argument.type.isSame(type)) {
                throw new TypeResolvingError(`Function [${found.node.identifier.value}] argument [${argument.identifier.value}] was invoked with expression of type [${type.describe()}] instead of [${argument.type.describe()}].`);
            }
        });

        return found.type;
    };

    const binary = (binary: BinaryExpression): Type => {
        const right = binary.right.acceptExpressionVisitor(expressionVisitor);
        const left = binary.left.acceptExpressionVisitor(expressionVisitor);

        if(!right.isSame(left)) {
            throw new TypeResolvingError(`Both sides of binary operation must have the same type ([${left.describe()}] is not equivalent to [${right.describe()}]).`);
        }

        const type = right;
        if(type.is(Primitive.BOOL)) {
            if(!BOOLEAN_OPERATORS.includes(binary.operator)) {
                throw new TypeResolvingError(`[${binary.operator}] is not a bool operator.`);
            }

            return type;
        }

        if(type.is(Primitive.INT) || type.is(Primitive.FLOAT)) {
            if(!NUMBER_OPERATORS.includes(binary.operator)) {
                throw new TypeResolvingError(`[${binary.operator}] is not a int or float operator.`);
            }

            if(BOOLEAN_OPERATORS.includes(binary.operator)) {
                return Type.from(Primitive.BOOL);
            }

            return type;
        }

        throw new TypeResolvingError(`Invalid binary expression [${left.describe()} ${binary.operator} ${right.describe()}].`);
    };

    const unary = (unary: UnaryExpression): Type => {
        const type = unary.expression.acceptExpressionVisitor(expressionVisitor);

        if(unary.operator === OperatorKind.MINUS || unary.operator === OperatorKind.PLUS) {
            if(type.is(Primitive.INT) && type.is(Primitive.FLOAT)) {
                throw new TypeResolvingError('Minus unary must affect an int or a float.');
            }

            return type;
        }

        if(unary.operator === OperatorKind.NOT) {
            if(type.is(Primitive.BOOL)) {
                throw new TypeResolvingError('Minus unary must affect a bool.');
            }

            return type;
        }

        throw new TypeResolvingError(`Invalid unary expression [${type.describe()} ${unary.operator}].`);
    };

    const expressionVisitor: ExpressionVisitor<Type> = {
        visitGroupingExpression: function (expression: GroupingExpression) {
            const type = expression.expression.acceptExpressionVisitor(expressionVisitor);

            expression.type = type;

            return type;
        },

        visitBinaryExpression: function (expression: BinaryExpression) {
            const type = binary(expression);

            expression.type = type;

            return type;
        },

        visitUnaryExpression: function (expression: UnaryExpression) {
            const type = unary(expression);

            expression.type = type;

            return type;
        },

        visitAccessor: function (expression: Accessor) {
            const symbol = context.lookup(expression.identifier);
            if(!symbol) {
                throw new TypeResolvingError(`Trying to access not declared variable [${expression.identifier.value}].`);
            }

            expression.type = symbol.type;
            return symbol.type;
        },

        visitInvocation: function (expression: Invocation) {
            const type = invocation(expression);

            expression.type = type;

            return type;
        },

        visitIntLiteral: function (expression: IntLiteral) {
            const type = Type.from(Primitive.INT);

            expression.type = type;

            return type;
        },

        visitFloatLiteral: function (expression: FloatLiteral) {
            const type = Type.from(Primitive.FLOAT);

            expression.type = type;

            return type;
        },

        visitBooleanLiteral: function (expression: BooleanLiteral) {
            const type = Type.from(Primitive.BOOL);

            expression.type = type;

            return type;
        }
    };

    const statementVisitor: StatementVisitor<Type | void> = {
        visitVariableDeclaration: function (declaration: VariableDeclaration): void {
            const type = declaration.expression.acceptExpressionVisitor(expressionVisitor);
            context.add(NodeResolver.resolveVariable(declaration, type));
        },

        visitExpression: function (expression: Expression): Type {
            return expression.acceptExpressionVisitor(expressionVisitor);
        }
    };

    const declarationVisitor: DeclarationVisitor<void> = {
        visitFunctionDeclaration: function (declaration: FunctionDeclaration): void {
            context.pushScope();

            declaration.arguments.forEach(arg => arg.acceptDeclarationVisitor(declarationVisitor));
            declaration.body.forEach((statement, index) => {
                try {
                    const type = statement.acceptStatementVisitor(statementVisitor);

                    if(!type) {
                        if(index === declaration.body.length - 1) {
                            throw new TypeResolvingError(`Function [${declaration.identifier.value}] must return an expression.`);
                        }

                        return;
                    }

                    if(!type.isSame(declaration.type)) {
                        throw new TypeResolvingError(`Function [${declaration.identifier.value}] returns ${type.describe()} instead of ${declaration.type.describe()}.`);
                    }
                } catch(e: unknown) {
                    handleError(e);
                }
            });

            context.popScope();
        },

        visitParameter: function (declaration: Parameter): void {
            context.add(NodeResolver.resolveParameter(declaration));
        },

        visitVariableDeclaration: function (declaration: VariableDeclaration): void {
            const type = declaration.expression.acceptExpressionVisitor(expressionVisitor);
            context.add(NodeResolver.resolveVariable(declaration, type));
        }
    };

    const moduleVisitor: ModuleVisitor<void> = {
        visitModule: function (module: Module): void {
            const [variables, functions] = declarationsOf(module);

            functions.forEach(fun => context.add(NodeResolver.resolveFunction(fun)));

            variables.forEach(variable => {
                try {
                    variable.acceptDeclarationVisitor(declarationVisitor);
                } catch(e: unknown) {
                    handleError(e);
                }
            });

            functions.forEach(fun => {
                try {
                    fun.acceptDeclarationVisitor(declarationVisitor);
                } catch(e: unknown) {
                    handleError(e);
                }
            });
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