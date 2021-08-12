type Props = {
    content: string
}

export const createSourceReader = ({content}: Props) => new SourceReader({ content });

export class SourceReader {
    private readonly content: string;

    private index = 0;
    private line = 1;
    private pinStart = 0;

    constructor({ content }: Props) {
        this.content = content;
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

        const current = this.content.charAt(this.index++);
        if (current !== "\n") {
            return current;
        }

        this.line++;
        return this.content.charAt(this.index++);
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
        return this.content.substring(this.pinStart, this.index);
    }

    lineIndex(): number {
        return this.line;
    }

    isAtEnd(): boolean {
        return this.index >= this.content.length;
    }

    current() {
        if (this.isAtEnd()) {
            return null;
        }

        return this.content.charAt(this.index);
    }

    next() {
        const nextIndex = this.index + 1;
        if (nextIndex >= this.content.length) {
            return null;
        }

        return this.content.charAt(nextIndex);
    }

    position() {
        return this.index;
    }
}