export interface Identifier {
    value: string
}

export type TypedIdentifier = Identifier & {
    type: string
}