import type { OnLoadArgs, OnLoadResult } from 'esbuild';

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

interface CliOutput {
    [key: string]: CliSuccessResult | CliErrorResult;
}

interface CliSuccessResult {
    firstSpecName: string;
    output: CliCompileOutput;
}

interface CliErrorResult {
    errors: CliError[]
}

interface CliError {
    message: string;
    file: string;
    path?: string[];
}

interface CliCompileOutput {
    [key: string]: CliCompileLanguage
}

interface CliCompileLanguage {
    [key: string]: CliOutputBundle
}

interface CliOutputBundle {
    topLevelName: string;
    files: Array<CliOutputFile>
}

interface CliOutputFile {
    fileName: string;
}

function runCompiler(compilerPath: string, flags: string[], timeout: number) {
    return new Promise<CliOutput>((resolve, reject) => {
        execFile(
            compilerPath,
            flags,
            {
                encoding: 'utf8',
                timeout: timeout,
                shell: false
            },
            (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                else if (stderr) {
                    reject(new Error(stderr));
                }
                else {
                    resolve(JSON.parse(stdout));
                }
            }
        );
    });
}

const buildError = (text: string, file: string, detail?: unknown) => ({ text, location: { file }, detail });
const buildErrorReturn = (text: string, file: string, detail?: unknown) => ({ errors: [buildError(text, file, detail)] });

/**
 * Options for running a kaitai compiler from the cli.
 */
export interface KaitaiCliOptions {
    compilerPath?: string;
    compilerFlags?: string[];
    compilerTimeout?: number;
    debug?: boolean;
}

/**
 * Compiles a ksy file with the command-line Kaitai Compiler.
 * @param file The file to compile.
 * @param options The compilation options.
 * @returns The results of the compilation.
 */
export async function compileKaitaiCli(file: OnLoadArgs, options?: KaitaiCliOptions): Promise<OnLoadResult> {
    // Make a temp dir for the output
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kaitai-'));
    try {
        // Get config options
        const compilerPath = options?.compilerPath || process.env.KAITAI_PATH || 'kaitai-struct-compiler';
        const compilerFlags = options?.compilerFlags || [];
        const compilerTimeout = options?.compilerTimeout || 10000;

        // Add required flags
        compilerFlags.push('--ksc-json-output');
        compilerFlags.push('--target', 'javascript');
        compilerFlags.push('--outdir', tmpDir);
        compilerFlags.push(file.path);

        // Run the compiler
        const result = await runCompiler(compilerPath, compilerFlags, compilerTimeout);

        // Get the result for our input file
        if (result[file.path]) {
            const fileResult = result[file.path];

            if ('output' in fileResult) {
                const jsResults = fileResult.output['javascript'];
                const mainSpec = fileResult.firstSpecName;
                const mainSpecResults = jsResults[mainSpec];

                // Assume the first output file is the only one
                const outputFileName = mainSpecResults.files[0].fileName;

                // Read the file from the tmp location
                const outputFilePath = path.join(tmpDir, outputFileName);
                const output = await fs.readFile(outputFilePath, { encoding: 'utf8' });

                await fs.writeFile('./debug.js', output);

                return {
                    contents: output,
                    loader: 'js',
                    resolveDir: path.dirname(file.path)
                };
            }
            else {
                return {
                    errors: fileResult.errors.map(e => buildError(e.message, e.file, e.path))
                };
            }
        }
        else {
            return buildErrorReturn('The Kaitai Compiler didn\'t return anything for this file.', file.path, result);
        }
    }
    finally {
        // Clean up the tmp folder
        fs.rm(tmpDir, { maxRetries: 4, retryDelay: 1000, recursive: true, force: true });
    }
}
