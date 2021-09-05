import type { FunctionDeclaration } from "../../ast/nodes/declarations/function";
import type { VariableDeclaration } from "../../ast/nodes/declarations/variable";
import type { TypedIdentifier } from "../../ast/nodes/identifier";
import type { FunctionMember, VariableMember } from "./member";
import { MemberKind } from "./member";

type FunctionMemberProps = { fun: FunctionDeclaration }
const functionMember = ({ fun }: FunctionMemberProps): FunctionMember => {
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

type VariableProps = { variable: VariableDeclaration, inferedType: string }
const variable = ({ variable, inferedType }: VariableProps): VariableMember => {
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