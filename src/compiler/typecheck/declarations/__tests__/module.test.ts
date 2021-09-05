import FunctionDeclarationFixture from "../../../../../test/compiler/ast/nodes/declaration/function";
import VariableDeclarationFixture from "../../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../../ast/nodes/builder";
import type { ModuleDeclarations} from "../module";
import { moduleDeclarationsOf } from "../module";

describe('ModuleDeclarations', () => {
    it('should create module declarations', () => {
        const function1 = FunctionDeclarationFixture.create();
        const function2 = FunctionDeclarationFixture.create();
        const function3 = FunctionDeclarationFixture.create();
        const variable = VariableDeclarationFixture.create();
        const exported = AstBuilder.exportation({ declaration: function3 });
        const module = AstBuilder.module({
            declarations: [
                function1, function2, variable, exported
            ]
        });

        const declarations = moduleDeclarationsOf(module);

        const expected: ModuleDeclarations = {
            functions: [function1, function2, function3],
            variables: [variable]
        };
        expect(declarations).toEqual(expected);
    });
});