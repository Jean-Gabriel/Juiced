import FunctionDeclarationFixture from "../../../../../test/compiler/ast/nodes/declaration/function";
import VariableDeclarationFixture from "../../../../../test/compiler/ast/nodes/declaration/variable";
import AstBuilder from "../../../ast/nodes/builder";
import type { ModuleDefinition} from "../module";
import { moduleDefinitionOf } from "../module";

describe('ModuleDefinition', () => {
    it('should create module definition', () => {
        const function1 = FunctionDeclarationFixture.create();
        const function2 = FunctionDeclarationFixture.create();
        const function3 = FunctionDeclarationFixture.create();
        const variable = VariableDeclarationFixture.create();
        const exported = AstBuilder.exportation({ declaration: function3 });
        const module = AstBuilder.source({
            declarations: [
                function1, function2, variable, exported
            ]
        });

        const definition = moduleDefinitionOf(module);

        const expected: ModuleDefinition = {
            functions: [function1, function2, function3],
            variables: [variable]
        };
        expect(definition).toEqual(expected);
    });
});