import { OperatorKind } from "../../../ast/nodes/expressions/operators";
import type { Type } from "../../../typing/type";
import { Primitive } from "../../../typing/type";
import type WATGenerationContext from "./context";
import type { SExp} from "./sexp";
import { sExp } from "./sexp";
import { v4 as uuid } from 'uuid';
import { WATVariableScope } from "./context";
import type { ExpressionVisitor } from "../../../ast/nodes/expressions/expression";
import type { VariableDeclaration } from "../../../ast/nodes/declarations/variable";
import type { Declaration } from "../../../ast/nodes/declarations/declaration";
import { AstNodeKind } from "../../../ast/nodes/node";

const type = (type: Type | undefined): string => {
    if(!type) {
        throw new Error(`Unexpected undefined type at code generation.`);
    }

    if(type.is(Primitive.INT)) {
        return 'i32';
    }

    if(type.is(Primitive.FLOAT)) {
        return 'f64';
    }

    if(type.is(Primitive.BOOL)) {
        return 'i32';
    }

    throw new Error(`Unexpected type at code generation ${type}.`);
};

const initialValue = (type: Type | undefined) => {
    if(!type) {
        throw new Error(`Unexpected undefined type at code generation.`);
    }

    if(type.is(Primitive.INT)) {
        return 'i32.const 0';
    }

    if(type.is(Primitive.FLOAT)) {
        return 'f64.const 0';
    }

    if(type.is(Primitive.BOOL)) {
        return 'i32.const 0';
    }

    throw new Error(`Unexpected type at code generation ${type}.`);
};



const operator = (operator: OperatorKind, type: Type) => {
    switch(operator) {
        case OperatorKind.DIVISION: {
            if(type.is(Primitive.INT)) { return `div_s`; }
            else { return 'div'; }
        };
        case OperatorKind.EQUAL_EQUAL: return 'eq';
        case OperatorKind.GREATER_EQUAL: {
            if(type.is(Primitive.INT)) { return 'ge_s'; }
            else { return 'ge'; }
        };
        case OperatorKind.GREATER_THAN: {
            if(type.is(Primitive.INT)) { return 'gt_s'; }
            else { return 'gt'; }
        };
        case OperatorKind.LESS_EQUAL: {
            if(type.is(Primitive.INT)) { return 'le_s'; }
            else { return 'le'; }
        };
        case OperatorKind.LESS_THAN: {
            if(type.is(Primitive.INT)) { return 'lt_s'; }
            else { return 'lt'; }
        };
        case OperatorKind.MINUS: return 'sub';
        case OperatorKind.MULTIPLICATION: return 'mul';
        case OperatorKind.NOT_EQUAL: return 'ne';
        case OperatorKind.PLUS: return 'add';
    }

    throw new Error(`Unexpected operator ${operator}.`);
};

const initialization = (context: WATGenerationContext, expressionVisitor: ExpressionVisitor<SExp>) => {
    const lateinits = context.getLateinitGlobals();
    if(!lateinits.length) {
        return sExp.create();
    }

    const init = sExp.identifier(context.alias(uuid()));

    const assignments = lateinits.flatMap(lateinit => {
        const found = context.find(lateinit.identifier);

        if(found.scope !== WATVariableScope.GLOBAL) {
            throw new Error('Unexpected lateinit local variable.');
        }

        return sExp.create(
            ...lateinit.expression.acceptExpressionVisitor(expressionVisitor),
            'global.set', sExp.identifier(found.global)
        );
    });

    return sExp.create(
        sExp.create(
            'func', init,
            ...assignments
        ),
        sExp.create('start', init)
    );
};

const local = (context: WATGenerationContext, local: VariableDeclaration) => {
    return sExp.create('local', sExp.identifier(context.local(local.identifier)), type(local.type));
};

const context = ({ kind }: Declaration) => {
    if(kind === AstNodeKind.VARIABLE_DECLARATION) {
        return 'global';
    }

    if(kind === AstNodeKind.FUNCTION_DECLARATION) {
        return 'func';
    }

    throw new Error(`Unexpected context for node kind ${kind}.`);
};

const global = (context: WATGenerationContext, declaration: VariableDeclaration, expressionVisitor: ExpressionVisitor<SExp>) => {
    const constantKinds = [AstNodeKind.INT_LITERAL, AstNodeKind.FLOAT_LITERAL, AstNodeKind.BOOLEAN_LITERAL];
    if(constantKinds.includes(declaration.expression.kind)) {
        return declaration.expression.acceptExpressionVisitor(expressionVisitor);
    }

    context.addLateinitGlobal(declaration);
    return sExp.create(initialValue(declaration.type));
};

export const wat = {
    type,
    initialValue,
    operator,
    initialization,
    local,
    global,
    context
};