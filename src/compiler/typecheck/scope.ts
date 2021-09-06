import type { Symbol} from "./symbols/symbol";
import { SymbolKind } from "./symbols/symbol";

type Props = {
    parent: Scope | null
}

export class Scope {
    static empty() {
        return new Scope({ parent: null });
    }

    private static childOf(parent: Scope) {
        return new Scope({ parent });
    }

    private readonly parent: Scope | null = null
    private readonly symbols: Symbol[] = []

    private constructor({ parent }: Props) {
        this.parent = parent;
    }

    add(symbol: Symbol) {
        this.symbols.push(symbol);
    }

    lookup(identifier: string): Symbol | null {
        const found = this.expandSymbols().find(symbol => symbol.name === identifier);

        if(found) {
            return found;
        }

        return this.parent?.lookup(identifier) || null;
    }

    push(): Scope {
        return Scope.childOf(this);
    }

    pop() {
        if(this.parent === null) {
            throw Error('Cannot get parent scope of the top level scope.');
        }

        return this.parent;
    }

    private expandSymbols(): Symbol[] {
        return this.symbols.flatMap(symbol => {
            if(symbol.kind === SymbolKind.VARIABLE) {
                return [symbol];
            }

            if(symbol.kind === SymbolKind.FUNCTION) {
                const args = symbol.args;
                return [symbol, ...args];
            }

            return [];
        });
    }
}