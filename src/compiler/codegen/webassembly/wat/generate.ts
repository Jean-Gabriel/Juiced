import type { Module, ModuleVisitor } from "../../../ast/nodes/module";
import type { SExp} from "./sexp";
import { identifier} from "./sexp";
import { string } from "./sexp";
import { sExp } from "./sexp";
import type { ExportVisitor, Export } from '../../../ast/nodes/export';
import type { Declaration, DeclarationVisitor } from "../../../ast/nodes/declarations/declaration";
import { AstNodeKind } from "../../../ast/nodes/node";
import WATGenerationContext from "./context";
import type { FunctionDeclaration } from "../../../ast/nodes/declarations/function";
import type { Parameter } from "../../../ast/nodes/declarations/parameter";
import type { VariableDeclaration } from "../../../ast/nodes/declarations/variable";
import type { Type } from "../../../typing/type";
import { Primitive } from "../../../typing/type";
import type { ExpressionVisitor } from "../../../ast/nodes/expressions/expression";
import type { GroupingExpression } from "../../../ast/nodes/expressions/grouping";
import type { BinaryExpression } from "../../../ast/nodes/expressions/binary";
import type { UnaryExpression } from "../../../ast/nodes/expressions/unary";
import type { Accessor } from "../../../ast/nodes/expressions/accessor";
import type { Invocation } from "../../../ast/nodes/expressions/invocation";
import type { BooleanLiteral, FloatLiteral, IntLiteral } from "../../../ast/nodes/expressions/literal";

export const generateWAT = (module: Module): SExp => {

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

        return sExp(watInitialTypeValue(declaration.type));
    };

    const expressionVisitor: ExpressionVisitor<SExp> = {
        visitGroupingExpression: function (expression: GroupingExpression): SExp {
            throw new Error("Function not implemented.");
        },
        visitBinaryExpression: function (expression: BinaryExpression): SExp {
            throw new Error("Function not implemented.");
        },
        visitUnaryExpression: function (expression: UnaryExpression): SExp {
            throw new Error("Function not implemented.");
        },
        visitAccessor: function (expression: Accessor): SExp {
            throw new Error("Function not implemented.");
        },
        visitInvocation: function (expression: Invocation): SExp {
            throw new Error("Function not implemented.");
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

    const declarationVisitor: DeclarationVisitor<SExp> = {
        visitFunctionDeclaration: function (declaration: FunctionDeclaration): SExp {
            const global = context.global(declaration.identifier);

            context.pushScope(declaration.identifier);

            const parameters = declaration.arguments.map(arg => arg.acceptDeclarationVisitor(this));
            const locals = localsOf(declaration).map(watLocalDefinition);

            const watFunction = sExp(
                'func',
                identifier(global),
                ...parameters,
                sExp('result', watType(declaration.type)),
                ...locals,
                // body
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
            return sExp(
                'export',
                string(node.declaration.identifier.value),
                sExp(
                    watContextOfDeclaration(node.declaration),
                    identifier(context.find(node.declaration.identifier))
                )
            );
        }
    };

    const moduleVisitor: ModuleVisitor<SExp> = {
        visitModule: function (module: Module): SExp {
            const watDeclarations = globalsOf(module).reduce((acc, declaration) => {
                return [...acc, declaration.acceptDeclarationVisitor(declarationVisitor)];
            }, new Array<SExp>());

            const watExports = module.declarations.reduce((acc, declaration) => {
                if(declaration.kind === AstNodeKind.EXPORT) {
                    return [...acc, declaration.acceptExport(exportVisitor)];
                }

                return acc;
            }, new Array<SExp>());

            return sExp('module', ...watDeclarations, ...watExports);
        }
    };

    return module.acceptModuleVisitor(moduleVisitor);
};