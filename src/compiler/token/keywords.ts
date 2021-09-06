import { Primitive } from "../juice/type";
import { TokenKind } from "./kinds";
import type { NonLiteralTokenKind } from "./token";

export const keywords = new Map<string, NonLiteralTokenKind>([
    [Primitive.F32, TokenKind.FLOAT_TYPE],
    [Primitive.I32, TokenKind.INT_TYPE],
    [Primitive.BOOL, TokenKind.BOOLEAN_TYPE],
    ['export', TokenKind.EXPORT],
    ['const', TokenKind.CONST],
    ['fun', TokenKind.FUN]
]);