import type { Parameter } from "../../ast/nodes/declarations/parameter";
import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import type { Type } from "../type";
import type { Declaration } from "../../ast/nodes/declarations/declaration";

export type ResolvedNode = {
    node: Declaration,
    type: Type
}

const resolveFunction = (declaration: FunctionDeclaration): ResolvedNode => {
    return {
        node: declaration,
        type: declaration.type
    };
};

const resolveParameter = (declaration: Parameter): ResolvedNode => {
    return {
        node: declaration,
        type: declaration.type
    };
};

const resolveVariable = (declaration: VariableDeclaration, type: Type): ResolvedNode => {
    declaration.type = type;

    return {
        node: declaration,
        type: declaration.type
    };
};

export const NodeResolver = {
    resolveFunction,
    resolveParameter,
    resolveVariable
};