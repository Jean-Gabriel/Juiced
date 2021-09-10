import { v4 } from "uuid";
import AstBuilder from "../../../../../src/compiler/ast/nodes/builder";
import type { FunctionArgument } from "../../../../../src/compiler/ast/nodes/declarations/arg";
import type { FunctionDeclaration } from "../../../../../src/compiler/ast/nodes/declarations/function";
import type { Identifier } from "../../../../../src/compiler/ast/nodes/identifier";
import type { Statement } from "../../../../../src/compiler/ast/nodes/statements/statement";
import { Primitive, Type } from "../../../../../src/compiler/typing/type";

export default class FunctionDeclarationFixture {
    static create(consume: (fixture: FunctionDeclarationFixture) => void = () => undefined): FunctionDeclaration {
        const fixture = new FunctionDeclarationFixture();
        consume(fixture);
        return fixture.create();
    }

    constructor(
        public identifier: Identifier = AstBuilder.identifier({ value: v4() }),
        public type: Type = Type.from(Primitive.I32),
        public args: FunctionArgument[] = [],
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