
export type SExp = SExp[] | string

export const sExp = {
    create: (...sExps: SExp[]) => sExps,
    string: (value: string) => `"${value}"`,
    identifier: (value: string) => `$${value}`
};

export const print = (sExp: SExp): string => {
    if(typeof sExp === 'string') {
        return sExp;
    }

    return `(${sExp.map(subSExp => print(subSExp)).join(' ')})`;
};