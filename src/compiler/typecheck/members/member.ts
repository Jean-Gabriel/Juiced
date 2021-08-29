export enum MemberKind {
    VARIABLE,
    FUNCTION
}

export interface Member {
    name: string,
    type: string,
    kind: MemberKind,
}