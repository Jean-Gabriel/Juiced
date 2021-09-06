import FunctionDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/function";
import VariableDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../ast/nodes/builder";
import { Primitive, Type } from "../../juice/type";
import SymbolsBuilder from "../symbols/builder";
import { Scope } from "../scope";

describe('Scope', () => {

    let scope: Scope = Scope.empty();

    beforeEach(() => {
        scope = Scope.empty();
    });

    it('should add symbol to scope', () => {
        const variable = VariableDeclarationFixture.create();
        const symbol = SymbolsBuilder.variableSymbol({ variable, type: Type.from(Primitive.I32) });

        scope.add(symbol);

        const found = scope.lookup(symbol.name);
        expect(found).toEqual(symbol);
    });

    it('should find symbol from a higher scope', () => {
        const variable = VariableDeclarationFixture.create();
        const symbol = SymbolsBuilder.variableSymbol({ variable, type: Type.from(Primitive.I32) });
        scope.add(symbol);

        scope = scope.push();

        const found = scope.lookup(symbol.name);
        expect(found).toEqual(symbol);
    });

    it('should find function arguments', () => {
        const fun = FunctionDeclarationFixture.create(_ =>
            _.args = [ AstBuilder.typedIdentifier({ value: 'test', type: Type.from(Primitive.I32) }) ]
        );
        const symbol = SymbolsBuilder.functionSymbol({ fun });
        scope.add(symbol);

        const found = scope.lookup('test');

        const expected = SymbolsBuilder.variableSymbol({
            variable: VariableDeclarationFixture.create(_ => _.identifier = AstBuilder.identifier({ value: 'test' })),
            type: Type.from(Primitive.I32)
        });
        expect(found).toEqual(expected);
    });

    it('should not be able to pop highest scope', () => {
        expect(() => scope.pop()).toThrowError();
    });

    it('should not find variable of poped scope', () => {
        const variable = VariableDeclarationFixture.create();
        const symbol = SymbolsBuilder.variableSymbol({ variable, type: Type.from(Primitive.I32) });
        scope = scope.push();

        scope.add(symbol);

        scope = scope.pop();
        const found = scope.lookup(symbol.name);
        expect(found).toBeNull();
    });
});