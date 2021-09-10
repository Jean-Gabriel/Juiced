import type { Type } from "../../typing/type";

export interface Identifier {
    value: string
}

export type TypedIdentifier = Identifier & {
    type: Type
}