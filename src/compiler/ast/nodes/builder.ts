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
import type { GroupingExpression } from "./expressions/grouping";

type SourceProps = { declarations: TopLevelDeclaration[] }
const source = ({ declarations }: SourceProps): Source => {
    return {
        kind: AstNodeKind.SOURCE,
        declarations,
        acceptSourceVisitor<T>(visitor: SourceVisitor<T>) {
            return visitor.visitSource(this);
        }
    };
};

type FunctionDeclarationProps = { identifier: Identifier, args: TypedIdentifier[], type: Identifier, statements: Statement[] }
const functionDeclaration = ({ identifier, args, type, statements }: FunctionDeclarationProps): FunctionDeclaration => {
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

type VariableDeclarationProps = { identifier: Identifier, expression: Expression }
const variableDeclaration = ({ identifier, expression }: VariableDeclarationProps): VariableDeclaration => {
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

type GroupingExpressionProps = { expression: Expression }
const grouping = ({ expression }: GroupingExpressionProps): GroupingExpression => {
    return {
        kind: AstNodeKind.GROUPING,
        expression,
        acceptExpressionVisitor<T>(visitor: ExpressionVisitor<T>) {
            return visitor.visitGroupingExpression(this);
        },
        acceptStatementVisitor<T>(vistor: StatementVisitor<T>) {
            return vistor.visitExpression(this);
        }
    };
};

type BinaryExpressionProps = { left: Expression, operator: BinaryOperator, right: Expression }
const binaryExpression = ({ left, operator, right }: BinaryExpressionProps): BinaryExpression => {
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

type UnaryExpressionProps = ({ operator: UnaryOperator, expression: Expression })
const unaryExpression = ({ operator, expression }: UnaryExpressionProps): UnaryExpression => {
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

type AccessorProps = { identifier: Identifier }
const accessor = ({ identifier }: AccessorProps): Accessor => {
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

type IntLiteralProps = { int: number }
const intLiteral = ({ int }: IntLiteralProps ): IntLiteral => {
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

type FloatLiteralProps = { float: number }
const floatLiteral = ({ float }: FloatLiteralProps): FloatLiteral => {
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

type BooleanLiteralProps = { bool: boolean }
const booleanLiteral = ({ bool }: BooleanLiteralProps): BooleanLiteral => {
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

type ExportationProps = { declaration: Declaration }
const exportation = ({ declaration }: ExportationProps): Export => {
    return {
        kind: AstNodeKind.EXPORT,
        declaration,
        acceptExport<T>(visitor: ExportVisitor<T>) {
            return visitor.visitExport(this);
        }
    };
};

type IdentifierProps = { value: string }
const identifier = ({ value }: IdentifierProps): Identifier => {
    return { value };
};

type TypedIdentifierProps = { value: string, type: string }
const typedIdentifier = ({ value, type }: TypedIdentifierProps): TypedIdentifier => {
    return { value, type };
};

const AstBuilder = {
    source,
    accessor,
    grouping,
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