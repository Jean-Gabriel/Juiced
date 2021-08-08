import type { BinaryExpression } from "./binary";
import type { ComparisonExpression } from "./comparison";
import type { UnaryExpression } from "./unary";

export interface ExpressionNode extends AstNode {
    acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>): T
}

interface ExpressionVisitor<T> {
    visitComparisonExpression(expression: ComparisonExpression): T
    visitBinaryExpression(expression: BinaryExpression): T
    visitUnaryExpression(expression: UnaryExpression): T
}

export type Expression = 
    | ComparisonExpression
    | BinaryExpression
    | UnaryExpression