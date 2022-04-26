import type { OnLoadResult } from 'esbuild';

import { promises as fs } from 'fs';
import path from 'path';

import YAML from 'yaml';

/**
 * Options for running a kaitai compiler from it's js api.
 */
 export interface KaitaiApiOptions {
    compiler: Compiler;
    fileLoader?: FileLoader;
    debug?: boolean;
}

/**
 * The api interface for loading a file.
 */
 export interface FileLoader {
    /**
     * Loads a Kaitai source file.
     * The default file loader reads files from the local filesystem and parses
     * them as YAML, but you can override this if you want to use a different
     * source or data format.
     * @param filePath The path to the file.
     * @param mode Indicates if the file path is relative ("rel") or absolute ("abs").
     */
    importYaml(filePath: string, mode: 'rel' | 'abs'): Promise<unknown>;
}

/**
 * The api interface for a Kaitai compiler.
 */
export interface Compiler {
    /**
     * Compiles the Kaitai source into a parser.
     * @param language The language to compile to.
     * @param data The Kaitai source data.
     * @param fileLoader (optional) The file loader to use to resolve imports.
     * @param debugMode (optional) Enables debug mode.
     */
    compile(language: string, data: unknown, fileLoader?: FileLoader | null | undefined, debugMode?: boolean | null | undefined): Promise<Record<string, string>>;
}

class DefaultFileLoader implements FileLoader {
    constructor(private root: string) { }
    async importYaml(filePath: string, mode: 'rel' | 'abs'): Promise<unknown> {
        const resolvedPath = mode == 'abs' ? filePath : path.resolve(this.root, filePath);
        const fileContent = await fs.readFile(resolvedPath, { encoding: 'utf-8' });
        return YAML.parse(fileContent);
    }
}

/**
 * Compiles a ksy file with the given API compiler.
 * @param filePath The path to the file to compile.
 * @param options The compilation options.
 * @returns The results of the compilation.
 */
export async function compileKaitaiApi(filePath: string, options: KaitaiApiOptions): Promise<OnLoadResult> {

    const root = path.dirname(filePath);
    const fileLoader = options.fileLoader || new DefaultFileLoader(root);
    const compiler = options.compiler;

    const fileData = await fileLoader.importYaml(filePath, 'abs');
    const results = await compiler.compile('javascript', fileData, fileLoader, false);

    // Assume the first output file is the only one
    const output = Object.values(results)[0];

    return {
        contents: output,
        loader: 'js',
        resolveDir: root
    };
}
