import type { VariableDeclaration } from "../../../ast/nodes/declarations/variable";
import type { Identifier } from "../../../ast/nodes/identifier";

type Alias = string
type Name = string

export enum WATVariableScope {
    GLOBAL,
    LOCAL
}

type WATVariable =
    | { local: string, scope: WATVariableScope.LOCAL }
    | { global: string, scope: WATVariableScope.GLOBAL }

export default class WATGenerationContext {

    private readonly globals: Map<Name, Alias> = new Map()
    private readonly locals: Map<Name, Alias> = new Map()

    private readonly lateinitGlobals: Array<VariableDeclaration> = []

    private readonly scopes: Identifier[] = []

    pushScope(identifier: Identifier) {
        this.scopes.unshift(identifier);
    }

    popScope() {
        this.scopes.shift();
        this.locals.clear();
    }

    global({ value }: Identifier) {
        const alias = this.alias(value);
        this.globals.set(value, alias);

        return alias;
    }

    local({ value }: Identifier) {
        const alias = this.alias(value);
        this.locals.set(value, alias);

        return alias;
    }

    find({ value }: Identifier): WATVariable {
        const local = this.locals.get(value);
        if(local) {
            return { local, scope: WATVariableScope.LOCAL };
        }

        const global = this.globals.get(value);
        if(global) {
            return { global, scope: WATVariableScope.GLOBAL };
        }

        throw new Error(`Unable to find local or global with name ${value}`);
    }

    addLateinitGlobal(declaration: VariableDeclaration) {
        this.lateinitGlobals.push(declaration);
    }

    getLateinitGlobals() {
        return this.lateinitGlobals;
    }

    alias(identifier: string): string {
        if(!this.scopes.length) {
            return identifier;
        }

        return `${this.scopesName.join("/")}/${identifier}`;
    }

    private get scopesName() {
        return this.scopes.map(scope => scope.value);
    }
}