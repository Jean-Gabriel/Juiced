import { isAlphaNumeric } from "../utils/char";

type Props = {
    source: string
}

export type SourceReaderFactory = (props: Props) => SourceReader
export const createSourceReader: SourceReaderFactory = ({ source }: Props) => new SourceReader({ source });

export class SourceReader {
    private readonly source: string;

    private index = 0;
    private line = 1;
    private pinStart = 0;

    constructor({ source }: Props) {
        this.source = source;
    }

    advanceWhile(condition: (char: string) => boolean) {
        let current = this.current();

        while (current && condition(current)) {
            this.index++;
            current = this.current();
        }
    }

    // A fresh line is a new line followed by an alphanumeric character
    isAtFreshLine(): boolean {
        let index = this.index;
        let isFreshLine = false;

        let current = this.source.charAt(index++);
        while(current != '\n' && !this.isPositionAtEnd(index)) {
            if(isAlphaNumeric(current)) {
                isFreshLine = true;
                break;
            }

            current = this.source.charAt(index++);
        }

        return isFreshLine;
    }

    read(): string | null {
        if (this.isAtEnd()) {
            return null;
        }

        return this.source.charAt(this.index++);
    }

    match(expected: string): boolean {
        if (this.isAtEnd() || this.current() != expected) {
            return false;
        }

        this.index++;
        return true;
    }

    pin() {
        this.pinStart = this.index;
    }

    pinned(): string {
        return this.source.substring(this.pinStart, this.index);
    }

    lineIndex(): number {
        return this.line;
    }

    isAtEnd(): boolean {
        return this.isPositionAtEnd(this.index);
    }

    current() {
        if (this.isAtEnd()) {
            return null;
        }

        return this.source.charAt(this.index);
    }

    next() {
        const nextIndex = this.index + 1;
        if (nextIndex >= this.source.length) {
            return null;
        }

        return this.source.charAt(nextIndex);
    }

    nextLine() {
        this.line++;
    }

    position() {
        return this.index;
    }

    private isPositionAtEnd(position: number) {
        return position >= this.source.length;
    }
}