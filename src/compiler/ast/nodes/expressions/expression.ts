import type { Accessor } from "./accessor";
import type { BinaryExpression } from "./binary";
import type { BooleanLiteral, FloatLiteral, IntLiteral, Literal } from "./literal";
import type { UnaryExpression } from "./unary";

export interface ExpressionNode extends AstNode {
    acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>): T
}

export interface ExpressionVisitor<T> {
    visitBinaryExpression(expression: BinaryExpression): T
    visitUnaryExpression(expression: UnaryExpression): T
    visitAccessor(expression: Accessor): T
    visitIntLiteral(expression: IntLiteral): T
    visitFloatLiteral(expression: FloatLiteral): T
    visitBooleanLiteral(expression: BooleanLiteral): T
}

export type Expression =
    | BinaryExpression
    | UnaryExpression
    | Literal
    | Accessor