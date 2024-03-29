import { Optional } from "../optional";

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
        type NumberValue = { value: number, numberValueOnlyField: number }

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

    it('should be present when value is not empty', () => {
        const present = Optional.of(1);

        expect(present.isPresent()).toBeTruthy();
    });

    it('should not be present when value is empty', () => {
        const empty = Optional.empty();

        expect(empty.isPresent()).toBeFalsy();
    });
});