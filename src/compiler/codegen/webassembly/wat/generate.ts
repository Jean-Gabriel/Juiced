import type { Module, ModuleVisitor } from "../../../ast/nodes/module";
import type { SExp} from "./sexp";
import { print} from "./sexp";
import { identifier} from "./sexp";
import { string } from "./sexp";
import { sExp } from "./sexp";
import type { ExportVisitor, Export } from '../../../ast/nodes/export';
import type { Declaration, DeclarationVisitor } from "../../../ast/nodes/declarations/declaration";
import { AstNodeKind } from "../../../ast/nodes/node";
import WATGenerationContext, { WATVariableScope } from "./context";
import type { FunctionDeclaration } from "../../../ast/nodes/declarations/function";
import type { Parameter } from "../../../ast/nodes/declarations/parameter";
import type { VariableDeclaration } from "../../../ast/nodes/declarations/variable";
import type { Type } from "../../../typing/type";
import { Primitive } from "../../../typing/type";
import type { Expression, ExpressionVisitor } from "../../../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../../../ast/nodes/expressions/grouping";
import type { BinaryExpression } from "../../../ast/nodes/expressions/binary";
import type { UnaryExpression } from "../../../ast/nodes/expressions/unary";
import type { Accessor } from "../../../ast/nodes/expressions/accessor";
import type { Invocation } from "../../../ast/nodes/expressions/invocation";
import type { BooleanLiteral, FloatLiteral, IntLiteral } from "../../../ast/nodes/expressions/literal";
import type { StatementVisitor } from "../../../ast/nodes/statements/statement";
import { OperatorKind } from "../../../ast/nodes/expressions/operators";
import { v4 as uuid } from 'uuid';
import { File } from "../../../../common/file";

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

    const watType = (type: Type | undefined): string => {
        if(!type) {
            throw new Error(`Unexpected undefined type at code generation`);
        }

        if(type.is(Primitive.I32)) {
            return 'i32';
        }

        if(type.is(Primitive.F32)) {
            return 'f32';
        }

        if(type.is(Primitive.BOOL)) {
            return 'i32';
        }

        throw new Error(`Unexpected type at code generation ${type}`);
    };

    const watInitialTypeValue = (type: Type | undefined) => {
        if(!type) {
            throw new Error(`Unexpected undefined type at code generation`);
        }

        if(type.is(Primitive.I32)) {
            return 'i32.const 0';
        }

        if(type.is(Primitive.F32)) {
            return 'f32.const 0';
        }

        if(type.is(Primitive.BOOL)) {
            return 'i32.const 0';
        }

        throw new Error(`Unexpected type at code generation ${type}`);
    };

    const watOperator = (operator: OperatorKind, type: Type) => {
        switch(operator) {
            case OperatorKind.DIVISION: {
                if(type.is(Primitive.I32)) { return `div_u`; }
                else { return 'div'; }
            };
            case OperatorKind.EQUAL_EQUAL: return 'eq';
            case OperatorKind.GREATER_EQUAL: {
                if(type.is(Primitive.I32)) { return 'ge_u'; }
                else { return 'ge'; }
            };
            case OperatorKind.GREATER_THAN: {
                if(type.is(Primitive.I32)) { return 'gt_u'; }
                else { return 'gt'; }
            };
            case OperatorKind.LESS_EQUAL: {
                if(type.is(Primitive.I32)) { return 'le_u'; }
                else { return 'le'; }
            };
            case OperatorKind.LESS_THAN: {
                if(type.is(Primitive.I32)) { return 'lt_u'; }
                else { return 'lt'; }
            };
            case OperatorKind.MINUS: return 'sub';
            case OperatorKind.MULTIPLICATION: return 'mul';
            case OperatorKind.NOT_EQUAL: return 'ne';
            case OperatorKind.PLUS: return 'add';
        }

        throw new Error(`Unexpected operator ${operator}`);
    };

    const watLocalDefinition = (local: VariableDeclaration) => {
        return sExp('local', identifier(context.local(local.identifier)), watType(local.type));
    };

    const watContextOfDeclaration = ({ kind }: Declaration) => {
        if(kind === AstNodeKind.VARIABLE_DECLARATION) {
            return 'global';
        }

        if(kind === AstNodeKind.FUNCTION_DECLARATION) {
            return 'func';
        }

        throw new Error(`Unexpected context for node kind ${kind}.`);
    };

    const watInitialGlobalValue = (declaration: VariableDeclaration) => {
        const constantNodes = [AstNodeKind.INT_LITERAL, AstNodeKind.FLOAT_LITERAL, AstNodeKind.BOOLEAN_LITERAL];
        if(constantNodes.includes(declaration.expression.kind)) {
            return declaration.expression.acceptExpressionVisitor(expressionVisitor);
        }

        context.addLateinitGlobal(declaration);
        return sExp(watInitialTypeValue(declaration.type));
    };

    const watInitializationOf = (lateinits: VariableDeclaration[]) => {
        if(!lateinits.length) {
            return sExp();
        }

        const init = identifier(context.scoped(uuid()));

        const watLateinits = lateinits.flatMap(lateinit => {
            const variable = context.find(lateinit.identifier);

            if(variable.scope !== WATVariableScope.GLOBAL) {
                throw new Error('Unexpected lateinit local variable');
            }

            return sExp(
                ...lateinit.expression.acceptExpressionVisitor(expressionVisitor),
                'global.set', identifier(variable.global)
            );
        });

        return sExp(
            sExp(
                'func', init,
                ...watLateinits
            ),
            sExp('start', init)
        );
    };

    const expressionVisitor: ExpressionVisitor<SExp> = {
        visitGroupingExpression: function (expression: GroupingExpression): SExp {
            return expression.expression.acceptExpressionVisitor(expressionVisitor);
        },
        visitBinaryExpression: function (expression: BinaryExpression): SExp {
            const left = expression.left.acceptExpressionVisitor(expressionVisitor);
            const right = expression.right.acceptExpressionVisitor(expressionVisitor);

            const type = expression.left.type;
            const watLeftType = watType(expression.left.type);

            if(!type) {
                throw new Error('unexpected expression without type');
            }

            return sExp(
                ...left,
                ...right,
                `${watLeftType}.${watOperator(expression.operator, type)}`,
            );
        },
        visitUnaryExpression: function (expression: UnaryExpression): SExp {
            const type = watType(expression.type);

            if(expression.operator === OperatorKind.MINUS) {
                return sExp(
                    `${type}.const -1`,
                    ...expression.expression.acceptExpressionVisitor(expressionVisitor),
                    `${type}.mul`
                );
            }

            if(expression.operator === OperatorKind.NOT) {
                return sExp(
                    ...expression.expression.acceptExpressionVisitor(expressionVisitor),
                    `i32.eqz`
                );
            }

            throw new Error(`Unexpected unary operator ${expression.operator}`);
         },
        visitAccessor: function (expression: Accessor): SExp {
            const accessor = context.find(expression.identifier);

            if(accessor.scope === WATVariableScope.GLOBAL) {
                return sExp(`global.get ${identifier(accessor.global)}`);
            }

            return sExp(`local.get ${identifier(accessor.local)}`);
        },
        visitInvocation: function (expression: Invocation): SExp {
            const invocation = context.find(expression.invoked);

            if(invocation.scope !== WATVariableScope.GLOBAL) {
                throw Error('Unexpected call to variable declaration.');
            }

            return sExp(`call ${identifier(invocation.global)}`);
        },
        visitIntLiteral: function (expression: IntLiteral): SExp {
            return sExp(`i32.const ${expression.value}`);
        },
        visitFloatLiteral: function (expression: FloatLiteral): SExp {
            return sExp(`f32.const ${expression.value}`);
        },
        visitBooleanLiteral: function (expression: BooleanLiteral): SExp {
            return sExp(`i32.const ${Number(expression.value)}`);
        }
    };

    const statementVisitor: StatementVisitor<SExp> = {
        visitVariableDeclaration: function (declaration: VariableDeclaration): SExp {
            const watExpression = declaration.expression.acceptExpressionVisitor(expressionVisitor);
            const local = context.find(declaration.identifier);

            if(local.scope !== WATVariableScope.LOCAL) {
                throw new Error('Unexpected global declared in function.');
            }

            return sExp(
                ...watExpression,
                'set_local', identifier(local.local)
            );
        },
        visitExpression: function (expression: Expression): SExp {
            return expression.acceptExpressionVisitor(expressionVisitor);
        }
    };

    const declarationVisitor: DeclarationVisitor<SExp> = {
        visitFunctionDeclaration: function (declaration: FunctionDeclaration): SExp {
            const global = context.global(declaration.identifier);

            context.pushScope(declaration.identifier);

            const parameters = declaration.arguments.map(arg => arg.acceptDeclarationVisitor(this));
            const locals = localsOf(declaration).map(watLocalDefinition);
            const body = declaration.body.flatMap(statement => statement.acceptStatementVisitor(statementVisitor));

            const watFunction = sExp(
                'func',
                identifier(global),
                ...parameters,
                sExp('result', watType(declaration.type)),
                ...locals,
                ...body
            );

            context.popScope();

            return watFunction;
        },

        visitParameter: function (declaration: Parameter): SExp {
            return sExp(
                'param',
                identifier(context.local(declaration.identifier)),
                watType(declaration.type)
            );
        },

        visitVariableDeclaration: function (declaration: VariableDeclaration): SExp {
            const watDeclaration = sExp(
                'global',
                identifier(context.global(declaration.identifier)),
                sExp('mut', watType(declaration.type)),
                watInitialGlobalValue(declaration)
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

            return sExp(
                'export',
                string(node.declaration.identifier.value),
                sExp(
                    watContextOfDeclaration(node.declaration),
                    identifier(found.global)
                )
            );
        }
    };

    const moduleVisitor: ModuleVisitor<File> = {
        visitModule: function (module: Module): File {
            const watDeclarations = globalsOf(module).reduce((acc, declaration) => {
                return [...acc, declaration.acceptDeclarationVisitor(declarationVisitor)];
            }, new Array<SExp>());

            const watExports = module.declarations.reduce((acc, declaration) => {
                if(declaration.kind === AstNodeKind.EXPORT) {
                    return [...acc, declaration.acceptExport(exportVisitor)];
                }

                return acc;
            }, new Array<SExp>());

            const watModuleInitialization = watInitializationOf(context.getLateinitGlobals());

            const watModule = sExp(
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