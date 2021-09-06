import type { Type } from "../../juice/type";

export enum SymbolKind {
    VARIABLE,
    FUNCTION
}

export type FunctionSymbol = {
    name: string,
    type: Type,
    args: VariableSymbol[]
    kind: SymbolKind.FUNCTION
}

export type VariableSymbol = {
    name: string,
    type: Type,
    kind: SymbolKind.VARIABLE,
}

export type Symbol =
    | FunctionSymbol
    | VariableSymbol