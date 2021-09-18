import { inspect } from "util";

export type SExp = SExp[] | string

export const sExp = {
    create: (...sExps: SExp[]) => sExps,
    string: (value: string) => `"${value}"`,
    identifier: (value: string) => `$${value}`
};

//TODO: Add proper print function once module generation testing is done
export const print = (sExp: SExp) => inspect(sExp)
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\,/g, '')
    .replace(/\'/g, '');