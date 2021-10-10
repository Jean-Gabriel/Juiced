import VariableDeclarationFixture from "../../../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../../../ast/nodes/builder";
import WATGenerationContext, { WATVariableScope } from "../context";

describe('WATGenerationContext', () => {

    let context = new WATGenerationContext();

    beforeEach(() => {
        context = new WATGenerationContext();
    });

    it('should add global variable to context', () => {
        const global = AstBuilder.identifier({ value: 'global_var' });

        context.global(global);

        const found = context.get(global);
        const expected = { scope: WATVariableScope.GLOBAL, global: global.value };
        expect(found).toEqual(expected);
    });

    it('should add local variable to context', () => {
        const local = AstBuilder.identifier({ value: 'local_var' });

        context.local(local);

        const found = context.get(local);
        const expected = { scope: WATVariableScope.LOCAL, local: local.value };
        expect(found).toEqual(expected);
    });

    it('should not get nonexistent global or local in context', () => {
        const nonexistent = AstBuilder.identifier({ value: 'nonexistent' });

        expect(() => context.get(nonexistent)).toThrowError();
    });

    it('should add lateinit vars', () => {
        const lateinit1 = VariableDeclarationFixture.create();
        const lateinit2 = VariableDeclarationFixture.create();

        context.addLateinitGlobal(lateinit1);
        context.addLateinitGlobal(lateinit2);

        expect(context.getLateinitGlobals()).toEqual([lateinit1, lateinit2]);
    });

    describe('enters scope', () => {

        const SCOPE_NAME = 'in_function_scope';

        beforeEach(() => {
            context.pushScope(AstBuilder.identifier({ value: SCOPE_NAME }));
        });

        it('should not take scope into account when adding global', () => {
            const global = AstBuilder.identifier({ value: 'global_var' });

            context.global(global);

            const found = context.get(global);
            const expected = { scope: WATVariableScope.GLOBAL, global: global.value };
            expect(found).toEqual(expected);
        });

        it('should take scope into account when addding local', () => {
            const local = AstBuilder.identifier({ value: 'local_var' });

            context.local(local);

            const found = context.get(local);
            const expected = { scope: WATVariableScope.LOCAL, local: `${SCOPE_NAME}/${local.value}` };
            expect(found).toEqual(expected);
        });

        describe('leaves scopes', () => {

            it('should clear locals', () => {
                const local = AstBuilder.identifier({ value: 'local_var' });
                context.local(local);

                context.popScope();

                expect(() => context.get(local)).toThrowError();
            });

            it('should add local in higher scope', () => {
                context.popScope();
                const local = AstBuilder.identifier({ value: 'local_var' });

                context.local(local);

                const found = context.get(local);
                const expected = { scope: WATVariableScope.LOCAL, local: local.value };
                expect(found).toEqual(expected);
            });

        });
    });
});