import { TokenKind } from "./kinds";
import { NonLiteralTokenKind } from "./token";

export const keywords = new Map<string, NonLiteralTokenKind>([
    ['let', TokenKind.LET],
    ['f32', TokenKind.FLOAT_TYPE],
    ['i32', TokenKind.INT_TYPE],
    ['bool', TokenKind.BOOLEAN_TYPE],
    ['export', TokenKind.EXPORT]
])