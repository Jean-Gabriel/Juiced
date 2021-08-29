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

    read(): string | null {
        if (this.isAtEnd()) {
            return null;
        }

        let current = this.source.charAt(this.index++);
        while(current && current === '\n') {
            this.line++;
            current = this.source.charAt(this.index++);
        }

        return current || null;
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
        return this.index >= this.source.length;
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

    position() {
        return this.index;
    }
}