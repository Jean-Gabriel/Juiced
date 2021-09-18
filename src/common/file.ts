import fs from 'fs';

type Props = {
    content: string,
}

export class File {

    private readonly content: string

    constructor({ content }: Props) {
        this.content = content;
    }

    save(path: string) {
        fs.writeFileSync(`${__dirname}/${path}`, this.content);
    }

    read() {
        return this.content;
    }
}