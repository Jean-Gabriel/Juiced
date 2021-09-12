import type { Parameter } from "../../ast/nodes/declarations/parameter";
import type { Declaration } from "../../ast/nodes/declarations/declaration";
import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import type { Type } from "../type";

export type Resolved = {
    declaration: Declaration,
    type: Type
}

const fun = (declaration: FunctionDeclaration): Resolved => {
    return {
        declaration,
        type: declaration.type
    };
};

const parameter = (declaration: Parameter): Resolved => {
    return {
        declaration,
        type: declaration.type
    };
};

const variable = (declaration: VariableDeclaration, type: Type): Resolved => {
    declaration.type = type;

    return {
        declaration,
        type: declaration.type
    };
};

export const NodeResolver = {
    fun,
    parameter,
    variable
};