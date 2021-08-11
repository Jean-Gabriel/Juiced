import { Optional } from "../optional";

type NumberValue = { value: number, numberValueOnlyField: number }

describe('Optional', () => {
    it('should map optional using function', () => {
        const number = Optional.of(1);

        const mapped = number.map((number) => number.toString());

        const expected = Optional.of('1');
        expect(mapped).toEqual(expected);
    });

    it('should not map empty optional', () => {
        const empty = Optional.empty();

        const mapped = empty.map(_ => 1);

        const expected = Optional.empty();
        expect(mapped).toEqual(expected);
    });

    it('should unguard guarded type', () => {
        const value = { value: 1 };
        const guarded = Optional.of(value);

        const mapped = guarded.unguard((val): val is NumberValue => typeof val.value === 'number');

        const nonOptional = mapped.orElseThrow(new Error());
        // the fact that the compiler let me do this proves this works
        expect(nonOptional.numberValueOnlyField).toBeUndefined();
    });

    it('should unguard guarded type', () => {
        const guarded = Optional.empty();

        const mapped = guarded.unguard((val): val is any => val === undefined);

        const nonOptional = mapped.orElseThrow(new Error());
        // the fact that the compiler let me do this proves this works
        expect(nonOptional.numberValueOnlyField).toBeUndefined();
    });

    it('shoul throw error when getting null value', () => {
        const empty = Optional.empty();
        const error = new Error('error');

        expect(() => empty.orElseThrow(error)).toThrow(error);
    });
});