import type { Module, ModuleVisitor } from "../../../ast/nodes/module";
import type { SExp} from "./sexp";
import { sExp} from "./sexp";
import { print} from "./sexp";
import type { ExportVisitor, Export } from '../../../ast/nodes/export';
import type { Declaration, DeclarationVisitor } from "../../../ast/nodes/declarations/declaration";
import { AstNodeKind } from "../../../ast/nodes/node";
import WATGenerationContext, { WATVariableScope } from "./context";
import type { FunctionDeclaration } from "../../../ast/nodes/declarations/function";
import type { Parameter } from "../../../ast/nodes/declarations/parameter";
import type { VariableDeclaration } from "../../../ast/nodes/declarations/variable";
import type { Expression, ExpressionVisitor } from "../../../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../../../ast/nodes/expressions/grouping";
import type { BinaryExpression } from "../../../ast/nodes/expressions/binary";
import type { UnaryExpression } from "../../../ast/nodes/expressions/unary";
import type { Accessor } from "../../../ast/nodes/expressions/accessor";
import type { Invocation } from "../../../ast/nodes/expressions/invocation";
import type { BooleanLiteral, FloatLiteral, IntLiteral } from "../../../ast/nodes/expressions/literal";
import type { StatementVisitor } from "../../../ast/nodes/statements/statement";
import { OperatorKind } from "../../../ast/nodes/expressions/operators";
import { File } from "../../../../common/file";
import { wat } from "./wat";

export const generateWAT = (module: Module): File => {

    const context = new WATGenerationContext();

    const globalsOf = (module: Module) => {
        return module.declarations
            .map(declaration => {
                if(declaration.kind === AstNodeKind.EXPORT) {
                    return declaration.declaration;
                }

                return declaration;
            })
            .filter((declaration): declaration is Declaration =>
                [AstNodeKind.VARIABLE_DECLARATION, AstNodeKind.FUNCTION_DECLARATION].includes(declaration.kind)
            );
    };

    const localsOf = (fun: FunctionDeclaration) => {
        return fun.body.reduce((acc, statement) => {
            if(statement.kind === AstNodeKind.VARIABLE_DECLARATION) {
                return [...acc, statement];
            }

            return acc;
        }, new Array<VariableDeclaration>());
    };

    const expressionVisitor: ExpressionVisitor<SExp> = {
        visitGroupingExpression: function (expression: GroupingExpression): SExp {
            return expression.expression.acceptExpressionVisitor(expressionVisitor);
        },
        visitBinaryExpression: function (expression: BinaryExpression): SExp {
            const left = expression.left.acceptExpressionVisitor(expressionVisitor);
            const right = expression.right.acceptExpressionVisitor(expressionVisitor);

            const type = expression.left.type;
            if(!type) {
                throw new Error('unexpected expression without type');
            }

            return sExp.create(
                ...left,
                ...right,
                `${wat.type(expression.left.type)}.${wat.operator(expression.operator, type)}`,
            );
        },
        visitUnaryExpression: function (expression: UnaryExpression): SExp {
            const type = wat.type(expression.type);

            if(expression.operator === OperatorKind.MINUS) {
                return sExp.create(
                    `${type}.const -1`,
                    ...expression.expression.acceptExpressionVisitor(expressionVisitor),
                    `${type}.mul`
                );
            }

            if(expression.operator === OperatorKind.NOT) {
                return sExp.create(
                    ...expression.expression.acceptExpressionVisitor(expressionVisitor),
                    `i32.eqz`
                );
            }

            throw new Error(`Unexpected unary operator ${expression.operator}`);
         },
        visitAccessor: function (expression: Accessor): SExp {
            const accessor = context.find(expression.identifier);

            if(accessor.scope === WATVariableScope.GLOBAL) {
                return sExp.create('global.get', sExp.identifier(accessor.global));
            }

            return sExp.create('local.get', sExp.identifier(accessor.local));
        },
        visitInvocation: function (expression: Invocation): SExp {
            const invocation = context.find(expression.invoked);

            if(invocation.scope !== WATVariableScope.GLOBAL) {
                throw Error('Unexpected call to variable declaration.');
            }

            return sExp.create('call', sExp.identifier(invocation.global));
        },
        visitIntLiteral: function (expression: IntLiteral): SExp {
            return sExp.create(`i32.const ${expression.value}`);
        },
        visitFloatLiteral: function (expression: FloatLiteral): SExp {
            return sExp.create(`float.const ${expression.value}`);
        },
        visitBooleanLiteral: function (expression: BooleanLiteral): SExp {
            return sExp.create(`i32.const ${Number(expression.value)}`);
        }
    };

    const statementVisitor: StatementVisitor<SExp> = {
        visitVariableDeclaration: function (declaration: VariableDeclaration): SExp {
            const watExpression = declaration.expression.acceptExpressionVisitor(expressionVisitor);
            const local = context.find(declaration.identifier);

            if(local.scope !== WATVariableScope.LOCAL) {
                throw new Error('Unexpected global declared in function.');
            }

            return sExp.create(
                ...watExpression,
                'set_local', sExp.identifier(local.local)
            );
        },
        visitExpression: function (expression: Expression): SExp {
            return expression.acceptExpressionVisitor(expressionVisitor);
        }
    };

    const declarationVisitor: DeclarationVisitor<SExp> = {
        visitFunctionDeclaration: function (declaration: FunctionDeclaration): SExp {
            const global = sExp.identifier(context.global(declaration.identifier));

            context.pushScope(declaration.identifier);

            const parameters = declaration.arguments.map(arg => arg.acceptDeclarationVisitor(this));
            const result = sExp.create('result', wat.type(declaration.type));
            const locals = localsOf(declaration).map(local => wat.local(context, local));
            const body = declaration.body.flatMap(statement => statement.acceptStatementVisitor(statementVisitor));

            const watFunction = sExp.create(
                'func',
                global,
                ...parameters,
                result,
                ...locals,
                ...body
            );

            context.popScope();

            return watFunction;
        },

        visitParameter: function (declaration: Parameter): SExp {
            return sExp.create(
                'param',
                sExp.identifier(context.local(declaration.identifier)),
                wat.type(declaration.type)
            );
        },

        visitVariableDeclaration: function (declaration: VariableDeclaration): SExp {
            const watDeclaration = sExp.create(
                'global',
                sExp.identifier(context.global(declaration.identifier)),
                sExp.create('mut', wat.type(declaration.type)),
                wat.global(context, declaration, expressionVisitor)
            );

            return watDeclaration;
        }
    };

    const exportVisitor: ExportVisitor<SExp> = {
        visitExport: function (node: Export): SExp {
            const found = context.find(node.declaration.identifier);

            if(found.scope !== WATVariableScope.GLOBAL) {
                throw Error('Unexpected exported global');
            }

            return sExp.create(
                'export',
                sExp.string(node.declaration.identifier.value),
                sExp.create(
                    wat.context(node.declaration),
                    sExp.identifier(found.global)
                )
            );
        }
    };

    const moduleVisitor: ModuleVisitor<File> = {
        visitModule: function (module: Module): File {
            const watDeclarations = globalsOf(module).reduce((acc, declaration) => {
                return sExp.create(...acc, declaration.acceptDeclarationVisitor(declarationVisitor));
            }, new Array<SExp>());

            const watExports = module.declarations.reduce((acc, declaration) => {
                if(declaration.kind === AstNodeKind.EXPORT) {
                    return sExp.create(...acc, declaration.acceptExport(exportVisitor));
                }

                return acc;
            }, new Array<SExp>());

            const watModuleInitialization = wat.initialization(context, expressionVisitor);

            const watModule = sExp.create(
                'module',
                ...watDeclarations,
                ...watModuleInitialization,
                ...watExports
            );

            return new File({ content: print(watModule) });
        }
    };

    return module.acceptModuleVisitor(moduleVisitor);
};