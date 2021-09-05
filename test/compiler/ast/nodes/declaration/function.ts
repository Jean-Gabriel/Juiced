import { v4 } from "uuid";
import AstBuilder from "../../../../../src/compiler/ast/nodes/builder";
import type { FunctionDeclaration } from "../../../../../src/compiler/ast/nodes/declarations/function";
import type { Identifier, TypedIdentifier } from "../../../../../src/compiler/ast/nodes/identifier";
import type { Statement } from "../../../../../src/compiler/ast/nodes/statements/statement";

export default class FunctionDeclarationFixture {
    static create(consume: (fixture: FunctionDeclarationFixture) => void = () => undefined): FunctionDeclaration {
        const fixture = new FunctionDeclarationFixture();
        consume(fixture);
        return fixture.create();
    }

    constructor(
        public identifier: Identifier = AstBuilder.identifier({ value: v4() }),
        public type: Identifier = AstBuilder.identifier({ value: 'i32' }),
        public args: TypedIdentifier[] = [],
        public body: Statement[] = []
    ) {}

    create(): FunctionDeclaration {
        return AstBuilder.functionDeclaration({
            identifier: this.identifier,
            args: this.args,
            type: this.type,
            body: this.body
        });
    }
}