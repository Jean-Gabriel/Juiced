import type { Member } from "./members/member";

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
    private readonly members: Member[] = []

    private constructor({ parent }: Props) {
        this.parent = parent;
    }

    add(member: Member) {
        this.members.push(member);
    }

    lookup(identifier: string): Member | null {
        const found = this.members.find(member => member.name === identifier);

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

}