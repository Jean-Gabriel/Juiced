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

        const unguarded = guarded.unguard((val): val is NumberValue => typeof val.value === 'number');

        const nonOptional = unguarded.orElseThrow(new Error());
        // the fact that the compiler let me do this proves this works
        expect(nonOptional.numberValueOnlyField).toBeUndefined();
    });

    it('should throw error when getting null value', () => {
        const empty = Optional.empty();
        const error = new Error('error');

        expect(() => empty.orElseThrow(error)).toThrow(error);
    });

    it('should not execute function if present', () => {
        const present = Optional.of(1);
        const fn = jest.fn();

        present.ifEmpty(fn);

        expect(fn).toHaveBeenCalledTimes(0);
    });

    it('should execute function if empty', () => {
        const empty = Optional.empty();
        const fn = jest.fn();

        empty.ifEmpty(fn);

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should map if empty', () => {
        const empty = Optional.empty();

        const mapped = empty.orElseMap(() => 1);

        expect(mapped).toEqual(1);
    });

    it('should not map if present', () => {
        const empty = Optional.of('not-mapped');

        const notMapped = empty.orElseMap(() => 'mapped');

        expect(notMapped).toEqual('not-mapped');
    });
});