import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import type { TypedIdentifier } from "../../ast/nodes/identifier";
import type { Type } from "../../typing/type";
import type { FunctionSymbol, VariableSymbol } from "./symbol";
import { SymbolKind } from "./symbol";

type FunctionSymbolProps = { fun: FunctionDeclaration }
const functionSymbol = ({ fun }: FunctionSymbolProps): FunctionSymbol => {
    return {
        name: fun.identifier.value,
        type: fun.type,
        args: fun.arguments.map(functionArgument),
        kind: SymbolKind.FUNCTION
    };
};

const functionArgument = (arg: TypedIdentifier): VariableSymbol => {
    return {
        name: arg.value,
        type: arg.type,
        kind: SymbolKind.VARIABLE,
    };
};

type VariableSymbolProps = { variable: VariableDeclaration, type: Type }
const variableSymbol = ({ variable, type }: VariableSymbolProps): VariableSymbol => {
    return {
        name: variable.identifier.value,
        type: type,
        kind: SymbolKind.VARIABLE
    };
};

const SymbolsBuilder = {
    functionSymbol,
    variableSymbol
};

export default SymbolsBuilder;