import { TokenKind } from "./kinds";
import type { NonLiteralTokenKind } from "./token";

export const keywords = new Map<string, NonLiteralTokenKind>([
    ['f32', TokenKind.FLOAT_TYPE],
    ['i32', TokenKind.INT_TYPE],
    ['bool', TokenKind.BOOLEAN_TYPE],
    ['export', TokenKind.EXPORT],
    ['const', TokenKind.CONST],
    ['fun', TokenKind.FUN]
]);