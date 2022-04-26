import Parser from '../formats/png.ksy';

export function parse(stream) {
    return new Parser(stream);
}
