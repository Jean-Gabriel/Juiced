import type { Identifier } from '../ast/nodes/identifier';
import type { ResolvedNode } from './resolve/type';

export type TypeContextFactory = () => TypeContext
export const createTypeContext = () => TypeContext.empty();

type Props = { scopes: Array<ResolvedNode>[] }
export class TypeContext {

    static empty() {
        return new TypeContext({ scopes: [ new Array<ResolvedNode>() ] });
    }

    private readonly scopes: Array<ResolvedNode>[]

    private constructor({ scopes }: Props) {
        this.scopes = scopes;
    }

    add(resolved: ResolvedNode) {
        const found = this.lookup(resolved.node.identifier);
        if(found) {
            throw new Error('Cannot add two resolved node with the same identifier to the same scope.');
        }

        this.currentScope.push(resolved);
    }

    lookup(identifier: Identifier): ResolvedNode | null {
        for (const scope of this.scopes) {
            const found = scope.find(r => r.node.identifier.value === identifier.value);

            if(found) {
                return found;
            }
        }

        return null;
    }

    pushScope() {
        this.scopes.unshift(new Array<ResolvedNode>());
    }

    popScope() {
        if(this.scopes.length === 1) {
            throw Error('Cannot get parent scope of the top level scope.');
        }

        this.scopes.shift();
    }

    get currentScope () {
        return this.scopes[0];
    }
}