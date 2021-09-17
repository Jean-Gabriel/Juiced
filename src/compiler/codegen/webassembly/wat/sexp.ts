export type SExp = SExp[] | string

export const sExp = (...sExps: SExp[]) => sExps;
export const string = (value: string) => `"${value}"`;
export const identifier = (value: string) => `$${value}`;