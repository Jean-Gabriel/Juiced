import type { Identifier } from "../../../ast/nodes/identifier";

type Alias = string

enum VariableType {
    GLOBAL,
    LOCAL
}

export default class WATGenerationContext {

    private readonly globals: Map<Identifier, Alias> = new Map()
    private readonly locals: Map<Identifier, Alias> = new Map()

    private readonly scopes: Identifier[] = []

    pushScope(identifier: Identifier) {
        this.scopes.unshift(identifier);
    }

    popScope() {
        this.scopes.shift();
        this.locals.clear();
    }

    global(identifier: Identifier) {
        this.globals.set(identifier, this.scoped(identifier));

        return this.globals.get(identifier)!!;
    }

    local(identifier: Identifier) {
        this.locals.set(identifier, this.scoped(identifier));

        return this.locals.get(identifier)!!;
    }

    find(identifier: Identifier) {
        const local = this.locals.get(identifier);
        if(local) {
            return local;
        }

        const global = this.globals.get(identifier);
        if(global) {
            return global;
        }

        throw new Error(`Unable to find local or global with name ${identifier.value}`);
    }

    scope() {
        return this.scopesName.join("/");
    }

    private scoped({ value }: Identifier): string {
        if(!this.scopes.length) {
            return value;
        }

        return `${this.scopesName.join("/")}/${value}`;
    }

    private get scopesName() {
        return this.scopes.map(scope => scope.value);
    }
}