import type { FunctionArgument } from "../../ast/nodes/declarations/arg";
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

const argument = (declaration: FunctionArgument): Resolved => {
    return {
        declaration,
        type: declaration.type
    };
};

const variable = (declaration: VariableDeclaration, type: Type): Resolved => {
    return {
        declaration,
        type
    };
};

export const NodeResolver = {
    fun,
    argument,
    variable
};