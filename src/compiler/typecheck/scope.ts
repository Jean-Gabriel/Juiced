import type { Member} from "./members/member";
import { MemberKind } from "./members/member";

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
        const found = this.listMembers().find(member => member.name === identifier);

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

    private listMembers(): Member[] {
        return this.members.flatMap(member => {
            if(member.kind === MemberKind.VARIABLE) {
                return [member];
            }

            if(member.kind === MemberKind.FUNCTION) {
                const args = member.args;
                return [member, ...args];
            }

            return [];
        });
    }
}