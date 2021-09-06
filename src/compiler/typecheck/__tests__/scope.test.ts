import FunctionDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/function";
import VariableDeclarationFixture from "../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../ast/nodes/builder";
import { Primitive, Type } from "../../juice/type";
import MemberBuilder from "../members/builder";
import { Scope } from "../scope";

describe('Scope', () => {

    let scope: Scope = Scope.empty();

    beforeEach(() => {
        scope = Scope.empty();
    });

    it('should add member to scope', () => {
        const variable = VariableDeclarationFixture.create();
        const member = MemberBuilder.variable({ variable, inferedType: Type.from(Primitive.I32) });

        scope.add(member);

        const found = scope.lookup(member.name);
        expect(found).toEqual(member);
    });

    it('should find member from a higher scope', () => {
        const variable = VariableDeclarationFixture.create();
        const member = MemberBuilder.variable({ variable, inferedType: Type.from(Primitive.I32) });
        scope.add(member);

        scope = scope.push();

        const found = scope.lookup(member.name);
        expect(found).toEqual(member);
    });

    it('should find function arguments', () => {
        const fun = FunctionDeclarationFixture.create(_ =>
            _.args = [ AstBuilder.typedIdentifier({ value: 'test', type: Type.from(Primitive.I32) }) ]
        );
        const member = MemberBuilder.functionMember({ fun });
        scope.add(member);

        const found = scope.lookup('test');

        const expected = MemberBuilder.variable({
            variable: VariableDeclarationFixture.create(_ => _.identifier = AstBuilder.identifier({ value: 'test' })),
            inferedType: Type.from(Primitive.I32)
        });
        expect(found).toEqual(expected);
    });

    it('should not be able to pop highest scope', () => {
        expect(() => scope.pop()).toThrowError();
    });

    it('should not find variable of poped scope', () => {
        const variable = VariableDeclarationFixture.create();
        const member = MemberBuilder.variable({ variable, inferedType: Type.from(Primitive.I32) });
        scope = scope.push();

        scope.add(member);

        scope = scope.pop();
        const found = scope.lookup(member.name);
        expect(found).toBeNull();
    });
});