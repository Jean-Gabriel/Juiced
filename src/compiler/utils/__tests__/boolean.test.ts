import { isBoolean, parseBoolean } from "../boolean"

describe('boolean', () => {
    it.each([
        ['true'],
        ['false']
    ])('%s should be a boolean', (value: string) => {
        expect(isBoolean(value)).toBeTruthy()
    })

    it.each([
        [''],
        ['not-a-boolean'],
        ['string-containing-a-boolean-true']
    ])('%s should not be a boolean', (value: string) => {
        expect(isBoolean(value)).toBeFalsy()
    })

    it.each<['true' | 'false', boolean]>([
        ['true', true],
        ['false', false]
    ])('%s should parse raw boolean', (value: 'true' | 'false', expected: boolean) => {
        expect(parseBoolean(value)).toEqual(expected)
    })
})