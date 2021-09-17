import type { Identifier } from "../../../ast/nodes/identifier";

export default class WATGenerationContext {
    private readonly scopes: Identifier[] = []

    pushScope(identifier: Identifier) {
        this.scopes.unshift(identifier);
    }

    popScope() {
        this.scopes.shift();
    }

    scoped(value: string | undefined): string {
        const names = this.scopes.map(scope => scope.value);

        if(!value) {
            return names.join("/");
        }

        return `${names.join("/")}/${value}`;
    }
}