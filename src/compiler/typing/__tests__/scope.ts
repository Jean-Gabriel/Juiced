import FunctionDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/function";
import VariableDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../ast/nodes/builder";
import { NodeResolver } from "../resolved/type";
import { ResolverScope } from "../scope";
import { Primitive, Type } from "../type";

describe('ResolverScope', () => {

    let scope: ResolverScope = ResolverScope.empty();

    beforeEach(() => {
        scope = ResolverScope.empty();
    });

    it('should add resolved variable to scope', () => {
        const variable = VariableDeclarationFixture.create();
        const resolved = NodeResolver.variable(variable, Type.from(Primitive.I32));

        scope.add(resolved);

        const found = scope.lookup(resolved.declaration.identifier);
        expect(found).toEqual(resolved);
    });

    it('should find symbol from a higher scope', () => {
        const variable = VariableDeclarationFixture.create();
        const resolved = NodeResolver.variable(variable, Type.from(Primitive.I32));
        scope.add(resolved);

        scope = scope.push();

        const found = scope.lookup(resolved.declaration.identifier);
        expect(found).toEqual(resolved);
    });

    it('should not add resolved node with same identifier to the same scope', () => {
        const identifier = AstBuilder.identifier({ value: 'identifier' });
        const variable = VariableDeclarationFixture.create(_ => _.identifier = identifier);
        const fun = FunctionDeclarationFixture.create(_ => _.identifier = identifier);
        scope.add(NodeResolver.variable(variable, Type.from(Primitive.I32)));

        expect(() => scope.add(NodeResolver.fun(fun))).toThrow();
    });

    it('should not be able to pop highest scope', () => {
        expect(() => scope.pop()).toThrowError();
    });

    it('should not find variable of poped scope', () => {
        const variable = VariableDeclarationFixture.create();
        const symbol = NodeResolver.variable(variable, Type.from(Primitive.I32));
        scope = scope.push();

        scope.add(symbol);

        scope = scope.pop();
        const found = scope.lookup(symbol.declaration.identifier);
        expect(found).toBeNull();
    });
});
