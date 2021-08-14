import type { Accessor } from "./expressions/accessor";
import type { Declaration, DeclarationVisitor } from "./declarations/declaration";
import type { FunctionDeclaration } from "./declarations/function";
import type { VariableDeclaration } from "./declarations/variable";
import type { BinaryExpression } from "./expressions/binary";
import type { Expression, ExpressionVisitor } from "./expressions/expression";
import type { BinaryOperator, UnaryOperator } from "./expressions/operators";
import type { UnaryExpression } from "./expressions/unary";
import type { Identifier, TypedIdentifier } from "./identifier";
import type { Source, SourceVisitor, TopLevelDeclaration } from "./source";
import type { Statement, StatementVisitor } from "./statements/statement";
import type { BooleanLiteral, FloatLiteral, IntLiteral } from "./expressions/literal";
import { AstNodeKind } from "./node";
import type { Export, ExportVisitor } from "./export";

const source = (declarations: TopLevelDeclaration[]): Source => {
    return {
        kind: AstNodeKind.SOURCE,
        declarations,
        acceptSourceVisitor<T>(visitor: SourceVisitor<T>) {
            return visitor.visitSource(this);
        }
    };
};

const functionDeclaration = (identifier: Identifier, args: TypedIdentifier[], type: Identifier, statements: Statement[]): FunctionDeclaration => {
    return {
        kind: AstNodeKind.FUNCTION_DECLARATION,
        identifier,
        body: statements,
        arguments: args,
        type,
        acceptDeclarationVisitor<T>(visitor: DeclarationVisitor<T>) {
            return visitor.visitFunctionDeclaration(this);
        }
    };
};

const variableDeclaration = (identifier: Identifier, expression: Expression): VariableDeclaration => {
    return {
        kind: AstNodeKind.VARIABLE_DECLARATION,
        identifier,
        expression,
        acceptDeclarationVisitor<T>(visitor: DeclarationVisitor<T>) {
            return visitor.visitVariableDeclaration(this);
        },
        acceptStatementVisitor<T>(visitor: StatementVisitor<T>) {
            return visitor.visitVariableDeclaration(this);
        }
    };
};

const binaryExpression = (left: Expression, operator: BinaryOperator, right: Expression): BinaryExpression => {
    return {
        kind: AstNodeKind.BINARY,
        left,
        operator,
        right,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitBinaryExpression(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

const unaryExpression = (operator: UnaryOperator, expression: Expression): UnaryExpression => {
    return {
        kind: AstNodeKind.UNARY,
        operator,
        expression,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitUnaryExpression(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

const accessor = (identifier: Identifier): Accessor => {
    return {
        kind: AstNodeKind.ACCESSOR,
        identifier,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitAccessor(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

const intLiteral = (int: number): IntLiteral => {
    return {
        kind: AstNodeKind.INT_LITERAL,
        value: int,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitIntLiteral(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

const floatLiteral = (float: number): FloatLiteral => {
    return {
        kind: AstNodeKind.FLOAT_LITERAL,
        value: float,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitFloatLiteral(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

const booleanLiteral = (bool: boolean): BooleanLiteral => {
    return {
        kind: AstNodeKind.BOOLEAN_LITERAL,
        value: bool,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitBooleanLiteral(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

const exportation = (declaration: Declaration): Export => {
    return {
        kind: AstNodeKind.EXPORT,
        declaration,
        acceptExport<T>(visitor: ExportVisitor<T>) {
            return visitor.visitExport(this);
        }
    };
};


const identifier = (value: string): Identifier => {
    return { value };
};

const typedIdentifier = (value: string, type: string): TypedIdentifier => {
    return { value, type };
};

const AstBuilder = {
    source,
    accessor,
    identifier,
    intLiteral,
    exportation,
    floatLiteral,
    booleanLiteral,
    typedIdentifier,
    unaryExpression,
    binaryExpression,
    variableDeclaration,
    functionDeclaration
};

export default AstBuilder;