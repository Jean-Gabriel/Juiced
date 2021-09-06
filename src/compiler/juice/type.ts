
export enum Primitive {
    I32 = 'i32',
    F32 = 'f32',
    BOOL = 'bool'
}

export class Type {

    static from(type: string) {
        return new Type(type);
    }

    constructor(
        private readonly type: string
    ) {}

    isSame(other: Type) {
        return other.type === this.type;
    }

    is(type: string) {
        return type === this.type;
    }
}