import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import type { TypedIdentifier } from "../../ast/nodes/identifier";
import type { Member} from "./member";
import { MemberKind } from "./member";

const functionMember = (fun: FunctionDeclaration): Member => {
    return {
        name: fun.identifier.value,
        type: fun.type.value,
        kind: MemberKind.FUNCTION
    };
};

const typedIdentifier = (identifier: TypedIdentifier): Member => {
    return {
        name: identifier.value,
        type: identifier.type,
        kind: MemberKind.VARIABLE
    };
};

const variable = (variable: VariableDeclaration, inferedType: string): Member => {
    return {
        name: variable.identifier.value,
        type: inferedType,
        kind: MemberKind.VARIABLE
    };
};

const MemberBuilder = {
    functionMember,
    typedIdentifier,
    variable
};

export default MemberBuilder;