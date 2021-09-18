import FunctionDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/function";
import VariableDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../ast/nodes/builder";
import { NodeResolver } from "../resolve/type";
import type { TypeContext } from "../context";
import { createTypeContext } from "../context";
import { Primitive, Type } from "../type";

describe('TypeContext', () => {

    let context: TypeContext = createTypeContext();

    beforeEach(() => {
        context = createTypeContext();
    });

    it('should add resolved variable to scope', () => {
        const variable = VariableDeclarationFixture.create();
        const resolved = NodeResolver.resolveVariable(variable, Type.from(Primitive.INT));

        context.add(resolved);

        const found = context.lookup(resolved.node.identifier);
        expect(found).toEqual(resolved);
    });

    it('should find resolved node from a higher scope', () => {
        const variable = VariableDeclarationFixture.create();
        const resolved = NodeResolver.resolveVariable(variable, Type.from(Primitive.INT));
        context.add(resolved);

        context.pushScope();

        const found = context.lookup(resolved.node.identifier);
        expect(found).toEqual(resolved);
    });

    it('should not add resolved node with same identifier to the same scope', () => {
        const identifier = AstBuilder.identifier({ value: 'identifier' });
        const variable = VariableDeclarationFixture.create(_ => _.identifier = identifier);
        const fun = FunctionDeclarationFixture.create(_ => _.identifier = identifier);
        context.add(NodeResolver.resolveVariable(variable, Type.from(Primitive.INT)));

        expect(() => context.add(NodeResolver.resolveFunction(fun))).toThrow();
    });

    it('should not be able to pop highest scope', () => {
        expect(() => context.popScope()).toThrowError();
    });

    it('should not find variable of poped scope', () => {
        const variable = VariableDeclarationFixture.create();
        const resolved = NodeResolver.resolveVariable(variable, Type.from(Primitive.INT));
        context.pushScope();

        context.add(resolved);

        context.popScope();
        const found = context.lookup(resolved.node.identifier);
        expect(found).toBeNull();
    });
});
