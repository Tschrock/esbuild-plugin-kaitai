import Parser from '../formats/invalid_property.ksy';

export function parse(stream) {
    return new Parser(stream);
}
