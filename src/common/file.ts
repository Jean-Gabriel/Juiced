import fs from 'fs';

type Props = {
    content: string | Buffer,
}

export class File {

    private readonly content: string | Buffer

    constructor({ content }: Props) {
        this.content = content;
    }

    save(path: string, name: string) {
        fs.writeFileSync(`${__dirname}/${path}/${name}`, this.content);
    }

    read() {
        return this.content;
    }
}