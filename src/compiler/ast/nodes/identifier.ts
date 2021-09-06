import type { Type } from "../../juice/type";

export interface Identifier {
    value: string
}

export type TypedIdentifier = Identifier & {
    type: Type
}