import type { AstNode } from "../node";
import type { Accessor } from "./accessor";
import type { BinaryExpression } from "./binary";
import type { GroupingExpression } from "./grouping";
import type { Invocation } from "./invocation";
import type { BooleanLiteral, FloatLiteral, IntLiteral, Literal } from "./literal";
import type { UnaryExpression } from "./unary";

export interface ExpressionNode extends AstNode {
    acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>): T
}

export interface ExpressionVisitor<T> {
    visitGroupingExpression(expression: GroupingExpression): T
    visitBinaryExpression(expression: BinaryExpression): T
    visitUnaryExpression(expression: UnaryExpression): T
    visitAccessor(expression: Accessor): T
    visitInvocation(expression: Invocation): T
    visitIntLiteral(expression: IntLiteral): T
    visitFloatLiteral(expression: FloatLiteral): T
    visitBooleanLiteral(expression: BooleanLiteral): T
}

export type Expression =
    | GroupingExpression
    | BinaryExpression
    | UnaryExpression
    | Literal
    | Accessor
    | Invocation