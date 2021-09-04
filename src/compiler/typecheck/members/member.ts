export enum MemberKind {
    VARIABLE,
    FUNCTION
}

export type FunctionMember = {
    name: string,
    type: string,
    args: VariableMember[]
    kind: MemberKind.FUNCTION
}

export type VariableMember = {
    name: string,
    type: string,
    kind: MemberKind.VARIABLE,
}

export type Member =
    | FunctionMember
    | VariableMember