import AstBuilder from "../../../../../src/compiler/ast/nodes/builder";
import type { VariableDeclaration } from "../../../../../src/compiler/ast/nodes/declarations/variable";
import type { Expression } from "../../../../../src/compiler/ast/nodes/expressions/expression";
import type { Identifier } from "../../../../../src/compiler/ast/nodes/identifier";
import { v4 } from "uuid";

export default class VariableDeclarationFixture {
    static create(consume: (fixture: VariableDeclarationFixture) => void = () => undefined): VariableDeclaration {
        const fixture = new VariableDeclarationFixture();
        consume(fixture);
        return fixture.create();
    }

    constructor(
        public identifier: Identifier = AstBuilder.identifier({ value: v4() }),
        public expression: Expression = AstBuilder.accessor({ identifier: AstBuilder.identifier({ value: 'hi' })})
    ) {}

    create(): VariableDeclaration {
        return AstBuilder.variableDeclaration({
            identifier: this.identifier,
            expression: this.expression
        });
    }
}