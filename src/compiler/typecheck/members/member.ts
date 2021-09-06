import type { Type } from "../../juice/type";

export enum MemberKind {
    VARIABLE,
    FUNCTION
}

export type FunctionMember = {
    name: string,
    type: Type,
    args: VariableMember[]
    kind: MemberKind.FUNCTION
}

export type VariableMember = {
    name: string,
    type: Type,
    kind: MemberKind.VARIABLE,
}

export type Member =
    | FunctionMember
    | VariableMember