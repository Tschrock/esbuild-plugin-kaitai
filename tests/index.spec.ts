/* eslint-disable @typescript-eslint/no-var-requires */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import { expect } from 'chai';
import * as esbuild from 'esbuild';
import KaitaiStream from 'kaitai-struct/KaitaiStream';

import kaitaiLoader from '../src';

let TESTS_SANDBOX_DIR: string;

function sandbox(file: string) {
    return path.resolve(TESTS_SANDBOX_DIR, file);
}

before(async () => {
    TESTS_SANDBOX_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'tests-output-'));
    console.log(TESTS_SANDBOX_DIR)
})

function buildFile(infile: string, outfile: string) {
    return esbuild.build({
        absWorkingDir: __dirname,
        entryPoints: [infile],
        bundle: true,
        format: 'cjs',
        platform: 'node',
        target: ['node10.4'],
        outfile,
        plugins: [
            kaitaiLoader()
        ],
    });
}

describe('esbuild', () => {
    it('should build the png import without errors', async () => {
        const results = await buildFile('./inputs/png.js', sandbox('png.js'));
        expect(results.errors).to.be.empty;
        expect(results.warnings).to.be.empty;
    })
})

describe('esbuild output', () => {
    it('should read the png test file', async () => {
        console.log(process.cwd())
        console.log(__dirname)
        const parser = require(sandbox('png.js'));
        const data = await fs.readFile('./tests/data/example.png');
        const result = parser.parse(new KaitaiStream(data));
        expect(result).to.exist;
    })
})

after(async () => {
    TESTS_SANDBOX_DIR && await fs.rm(TESTS_SANDBOX_DIR, { recursive: true, force: true })
})
