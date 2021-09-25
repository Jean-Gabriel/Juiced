import { File } from "../../../../common/file";
import type { Module, ModuleVisitor } from "../../../ast/nodes/module";
import { render } from 'mustache';
import type { Export, ExportVisitor } from "../../../ast/nodes/export";
import type { Declaration, DeclarationVisitor } from "../../../ast/nodes/declarations/declaration";
import type { FunctionDeclaration } from "../../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../../ast/nodes/declarations/variable";
import { AstNodeKind } from "../../../ast/nodes/node";
import capitalize from 'lodash/capitalize';
import type { Parameter } from "../../../ast/nodes/declarations/parameter";
import type { Type } from "../../../typing/type";
import { Primitive } from "../../../typing/type";

type ModuleName = string

interface SignatureView {
    name: string,
    type: string
}

interface ExportView {
    name: string,
    accessor: string
}

interface View {
    module: string
    signatures: SignatureView[]
    exports: ExportView[]
}

const pathToTemplate = `${__dirname}/templates/module.template`;

export const generateWebAssemblyModule = (module: Module, name: ModuleName): File => {

    const typescriptTypeOf = (type?: Type): string => {
        if(type === undefined) {
            throw new Error(`Unexpected undefined type in WebAssembly module generation.`);
        }

        if(type.is(Primitive.INT) || type.is(Primitive.FLOAT)) {
            return 'number';
        }

        if(type.is(Primitive.BOOL)) {
            return 'boolean';
        }

        throw new Error(`Unexpected type ${type} in WebAssembly module generation.`);
    };

    const declarationVisitor: DeclarationVisitor<SignatureView> = {
        visitFunctionDeclaration: function (declaration: FunctionDeclaration): SignatureView {
            const args = declaration.arguments.map(argument => argument.acceptDeclarationVisitor(declarationVisitor));

            return {
                name: declaration.identifier.value,
                type: `(${args.join(',')}) => ${typescriptTypeOf(declaration.type)}`
            };
        },
        visitParameter: function (declaration: Parameter): any {
            return `${declaration.identifier.value}: ${typescriptTypeOf(declaration.type)}`;
        },
        visitVariableDeclaration: function (declaration: VariableDeclaration): SignatureView {
            return {
                name: declaration.identifier.value,
                type: typescriptTypeOf(declaration.type)
            };
        }
    };

    const exportVisitor: ExportVisitor<ExportView> = {
        visitExport: function (node: Export): ExportView {
            let accessor = 'exports.';

            if(node.declaration.kind === AstNodeKind.FUNCTION_DECLARATION) {
                accessor += node.declaration.identifier.value;
            }

            if(node.declaration.kind === AstNodeKind.VARIABLE_DECLARATION) {
                accessor += `${node.declaration.identifier.value}.value`;
            }

            return {
                name: node.declaration.identifier.value,
                accessor
            };
        }
    };

    const moduleVisitor: ModuleVisitor<View> = {
        visitModule: function (module: Module): View {
            const exports = module.declarations.filter((declaration): declaration is Export =>
                declaration.kind === AstNodeKind.EXPORT
            );

            const declarations = exports
                .map(exp => exp.declaration)
                .filter((declaration): declaration is Declaration =>
                    declaration.kind === AstNodeKind.FUNCTION_DECLARATION ||
                    declaration.kind === AstNodeKind.VARIABLE_DECLARATION
                );

            return {
                module: capitalize(name),
                exports: exports.map(exp => exp.acceptExport(exportVisitor)),
                signatures: declarations.map(declaration => declaration.acceptDeclarationVisitor(declarationVisitor))
            };
        }
    };

    const template = File.read(pathToTemplate);

    const view = moduleVisitor.visitModule(module);
    const output = render(template.asString(), view, {}, { tags: ["[[", "]]"]});

    return new File({ content: output });
};