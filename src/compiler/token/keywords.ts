import { TokenKind } from "./kinds";
import type { NonLiteralTokenKind } from "./token";

export const keywords = new Map<string, NonLiteralTokenKind>([
    ['float', TokenKind.FLOAT_TYPE],
    ['int', TokenKind.INT_TYPE],
    ['bool', TokenKind.BOOLEAN_TYPE],
    ['export', TokenKind.EXPORT],
    ['const', TokenKind.CONST],
    ['fun', TokenKind.FUN]
]);