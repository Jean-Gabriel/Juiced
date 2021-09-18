import { inspect } from "util";

export type SExp = SExp[] | string

export const sExp = (...sExps: SExp[]) => sExps;
export const string = (value: string) => `"${value}"`;
export const identifier = (value: string) => `$${value}`;

export const print = (sExp: SExp) => inspect(sExp)
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\,/g, '')
    .replace(/\'/g, '');