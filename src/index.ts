
import type { OnResolveResult, OnLoadResult, Plugin, PluginBuild } from 'esbuild';
import type { Compiler, FileLoader, KaitaiApiOptions } from './kaitai/api';
import type { KaitaiCliOptions } from './kaitai/cli';

import path from 'path';
import { compileKaitaiApi } from './kaitai/api';
import { compileKaitaiCli } from './kaitai/cli';

export type { FileLoader, Compiler };

/**
 * Kaitai options.
 */
export type KaitaiOptions = KaitaiApiOptions | KaitaiCliOptions;

/**
 * Loads `.ksy` files.
 */
function kaitaiLoader(options?: KaitaiOptions): Plugin {
    return {
        name: 'kaitai',
        setup(build: PluginBuild) {
            // Resolve "*.ksy" files
            build.onResolve({ filter: /\.(?:ksy)$/, namespace: 'file' }, (file): OnResolveResult | undefined => {
                // Ignore unresolvable paths
                if (file.resolveDir === '') return;

                // Forward to our namespace
                return {
                    path: path.resolve(file.resolveDir, file.path),
                    namespace: 'ksy'
                }
            });

            // Catch "*.ksy" files and build them with the kaitai compiler
            build.onLoad({ filter: /\.(?:ksy)$/, namespace: 'ksy' }, async (file): Promise<OnLoadResult> => {
                if (options && 'compiler' in options) {
                    return compileKaitaiApi(file.path, options);
                }
                else {
                    return compileKaitaiCli(file, options);
                }
            });
        }
    };
}

export { kaitaiLoader, kaitaiLoader as default };
