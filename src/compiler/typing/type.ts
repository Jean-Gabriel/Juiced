export enum Primitive {
    INT = 'int',
    FLOAT = 'float',
    BOOL = 'bool'
}

export class Type {

    static from(type: string) {
        return new Type(type);
    }

    private constructor(
        private readonly type: string
    ) {}

    isSame(other: Type) {
        return other.type === this.type;
    }

    is(type: string) {
        return type === this.type;
    }

    describe(): string {
        return this.type;
     }
}