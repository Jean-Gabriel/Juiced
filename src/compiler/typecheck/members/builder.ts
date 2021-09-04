import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import type { TypedIdentifier } from "../../ast/nodes/identifier";
import type { FunctionMember, VariableMember } from "./member";
import { MemberKind } from "./member";

const functionMember = (fun: FunctionDeclaration): FunctionMember => {
    return {
        name: fun.identifier.value,
        type: fun.type.value,
        args: fun.arguments.map(functionArgument),
        kind: MemberKind.FUNCTION
    };
};

const functionArgument = (arg: TypedIdentifier): VariableMember => {
    return {
        name: arg.value,
        type: arg.type,
        kind: MemberKind.VARIABLE,
    };
};

const variable = (variable: VariableDeclaration, inferedType: string): VariableMember => {
    return {
        name: variable.identifier.value,
        type: inferedType,
        kind: MemberKind.VARIABLE
    };
};

const MemberBuilder = {
    functionMember,
    variable
};

export default MemberBuilder;