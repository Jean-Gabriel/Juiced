import type { Identifier } from '../ast/nodes/identifier';
import type { Resolved } from './resolved/type';

type Props = {
    parent: ResolverScope | null
}

export class ResolverScope {
    static empty() {
        return new ResolverScope({ parent: null });
    }

    private static childOf(parent: ResolverScope) {
        return new ResolverScope({ parent });
    }

    private readonly parent: ResolverScope | null = null
    private readonly resolved: Resolved[] = []

    private constructor({ parent }: Props) {
        this.parent = parent;
    }

    add(resolved: Resolved) {
        this.resolved.push(resolved);
    }

    lookup(identifier: Identifier): Resolved | null {
        const found = this.resolved.find(r => r.declaration.identifier.value === identifier.value);

        if(found) {
            return found;
        }

        return this.parent?.lookup(identifier) || null;
    }

    push(): ResolverScope {
        return ResolverScope.childOf(this);
    }

    pop() {
        if(this.parent === null) {
            throw Error('Cannot get parent scope of the top level scope.');
        }

        return this.parent;
    }
}