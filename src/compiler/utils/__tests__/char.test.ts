import { isAlpha, isAlphaNumeric, isDigit } from "../char"

describe('char', () => {
    it('numbers chars should be a digit', () => {
        const numbers = '1234567890'
        
        forCharsIn(numbers).expectTruhty(isDigit)
    })

    it('special characters and letters should not be digits', () => {
        expect(isDigit('a')).toBeFalsy()
        expect(isDigit('!')).toBeFalsy()
    })

    it('capitalized and lowercase letters and underscores should be alphabetic', () => {
        const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'

        forCharsIn(letters).expectTruhty(isAlpha)
    })

    it('special characters and digits should not be in alphabet', () => {
        expect(isAlpha('1')).toBeFalsy()
        expect(isAlpha('!')).toBeFalsy()
    })

    it('capitalized and lowercase letters, underscores and digits should be alphanumeric', () => {
        const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
        
        forCharsIn(alphanumeric).expectTruhty(isAlphaNumeric)
    })

    it('symbols should not be alphanumeric', () => {
        expect(isAlphaNumeric('!')).toBeFalsy()
    })

    const forCharsIn = (sequence: string) => {
        const chars = sequence.split('')

        return {
            expectTruhty: (condition: (char: string) => boolean) => chars.forEach(char => expect(condition(char)).toBeTruthy())
        }
    }
})