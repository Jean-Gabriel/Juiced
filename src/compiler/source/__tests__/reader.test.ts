import { createSourceReader } from '../reader';

describe('SourceReader', () => {

    const givenSourceReader = (content: string) => createSourceReader({ source: content });

    it('should initially be at start first line', () => {
        const reader = givenSourceReader('');

        reader.read();

        expect(reader.lineIndex()).toEqual(1);
    });

    it('should get pinned string', () => {
        const content = 'test_';
        const reader = givenSourceReader(content);
        reader.pin();
        reader.advanceWhile((char) => char !== '_');

        const pinned = reader.pinned();

        const expected = 'test';
        expect(pinned).toEqual(expected);
    });

    it('should advance while condition is true', () => {
        const content = 'test_';
        const reader = givenSourceReader(content);

        reader.advanceWhile((char) => char !== '_');

        expect(reader.current()).toEqual('_');
    });

    it('should advance until end if condition is never met', () => {
        const content = 'test_';
        const reader = givenSourceReader(content);

        reader.advanceWhile((char) => char !== '!');

        expect(reader.isAtEnd()).toBeTruthy();
    });

    it('should not advance if condition is met instantly', () => {
        const content = '_test';
        const reader = givenSourceReader(content);

        reader.advanceWhile((char) => char !== '_');

        expect(reader.current()).toEqual('_');
    });

    it('should not read char when reader is at end of file', () => {
        const reader = givenSourceReader('');

        expect(reader.read()).toBeNull();
    });

    it('should increment line when encoutering a new line', () => {
        const reader = givenSourceReader('\r\n');

        reader.read();

        expect(reader.lineIndex()).toEqual(3);
    });

    it('should return read char', () => {
        const reader = givenSourceReader('Test');

        const char = reader.read();

        expect(char).toEqual('T');
    });

    it('should advance if current char matches', () => {
        const reader = givenSourceReader('Test');

        reader.match('T');

        expect(reader.current()).toEqual('e');
    });

    it('should be case sensitive when matching', () => {
        const reader = givenSourceReader('Test');

        expect(reader.match('t')).toBeFalsy();
    });

    it('should not match different char', () => {
        const reader = givenSourceReader('c');

        expect(reader.match('T')).toBeFalsy();
    });

    it('should not match if reader is at end of file', () => {
        const reader = givenSourceReader('');

        expect(reader.match('T')).toBeFalsy();
    });

    it('should not have current char if reader is at end of file', () => {
        const reader = givenSourceReader('');

        expect(reader.current()).toBeNull();
    });

    it('should return next char in source', () => {
        const reader = givenSourceReader('Te');

        expect(reader.next()).toBe('e');
    });

    it('should not have next char if reader is at end of file', () => {
        const reader = givenSourceReader('');

        expect(reader.next()).toBeNull();
    });

    it('should not have next char if reader is at last char of source', () => {
        const reader = givenSourceReader('T');

        expect(reader.next()).toBeNull();
    });
});