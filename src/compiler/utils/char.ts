export const isDigit = (char: string | null) => {
    if(char === null) {
        return false
    }

    return char >= '0' && char <= '9';
}

export const isAlpha = (char: string | null) => {
    if(char === null) {
        return false
    }

    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
            char == '_';
  }

export const isAlphaNumeric = (char: string | null) => {
    if(char === null) {
        return false
    }

    return isAlpha(char) || isDigit(char);
  }