esbuild-plugin-kaitai
=====================

An esbuild plugin to compile Kaitai struct files.

## Prerequisites
- [esbuild](https://esbuild.github.io/) >= 0.11.0
- [nodejs](https://nodejs.org/) >= 10.0.0
- [The Kaitai Compiler](https://kaitai.io/) >= 0.9

## Installation

Install the plugin from your javascript package manager
```sh
# yarn
yarn add --dev esbuild-plugin-kaitai

# or npm
npm install --save-dev esbuild-plugin-kaitai
```

## Usage

<details><summary>Typescript</summary>

> Note: The Kaitai Compiler and Runtime do not directly support Typescript yet, but there's some workarounds you can use to get everything working nicely.

1. Replace the `kaitai-struct` runtime with `@tschrock/kaitai-struct` for typescript support

    ```
    $ npm install kaitai-struct@npm:@tschrock/kaitai-struct
    ```

2. Write a type shim for your .ksy file.

    > I have written an experimental type generator for .ksy files. It's not perfect, and will probably break for complex schemas, but it will give you a good starting point.
    > ### Installation
    > ```sh
    > $ npm i -g @tschrock/kaitai-dts
    > ```
    > ### Usage
    > ```sh
    > $ kaitai-dts my-data.ksy
    > ```

    ```ts
    // my-data.ksy.d.ts
    declare module "my-data.ksy" {
        class MyData {
            version: string;
            recordType: MyData.ExampleEnum;
            recordData: UInt8Array;
            constructor(_io: any, _parent?: any, _root?: any);
            _read(): void;
        }
        namespace MyData {
            enum ExampleEnum {
                ITEM_1 = 1,
                ITEM_2 = 2,
                ITEM_3 = 3,
            }
        }
    }
    ```

3. Add the kaitai plugin to the list of plugins in your build script:
    ```ts
    // build.ts
    import esbuild from 'esbuild';
    import kaitaiLoader from 'esbuild-plugin-kaitai';

    esbuild.build({
        ...
        plugins: [
            kaitaiLoader({
                // Plugin config
            })
        ]
        ...
    });
    ```

4. You can now directly import `.ksy` files in your application, and esbuild will automatically compile them.
    ```ts
    // myapp.ts
    import { readFileSync } from 'fs';
    import KaitaiStream from 'kaitai-struct/KaitaiStream';
    import MyData from 'my-data.ksy';

    const myDataBin = readFileSync("./mydata.bin")
    const myData = new MyData(new KaitaiStream(myDataBin));
    console.log(myData);
    ```

</details>

<details><summary>Javascript (modules)</summary>

1. Add the kaitai plugin to the list of plugins in your build script:
    ```js
    // build.js
    import esbuild from 'esbuild';
    import kaitaiLoader from 'esbuild-plugin-kaitai';

    esbuild.build({
        ...
        plugins: [
            kaitaiLoader({
                // Plugin config
            })
        ]
        ...
    });
    ```

2. You can now directly import `.ksy` files in your application, and esbuild will automatically compile them.
    ```js
    // myapp.js
    import { readFileSync } from 'fs';
    import KaitaiStream from 'kaitai-struct/KaitaiStream';
    import MyData from 'my-data.ksy';

    const myDataBin = readFileSync("./mydata.bin")
    const myData = new MyData(new KaitaiStream(myDataBin));
    console.log(myData);
    ```

</details>

<details><summary>Javascript (commonjs)</summary>

1. Add the kaitai plugin to the list of plugins in your build script:
    ```js
    // build.js
    const esbuild = require('esbuild');
    const kaitaiLoader = require('esbuild-plugin-kaitai');

    esbuild.build({
        ...
        plugins: [
            kaitaiLoader({
                // Plugin config
            })
        ]
        ...
    });
    ```

2. You can now directly require `.ksy` files in your application, and esbuild will automatically compile them.
    ```js
    // myapp.js
    const { readFileSync } = require('fs');
    const KaitaiStream  = require('kaitai-struct/KaitaiStream');
    const MyData = require('my-data.ksy');

    const myDataBin = readFileSync("./mydata.bin")
    const myData = new MyData(new KaitaiStream(myDataBin));
    console.log(myData);
    ```

</details>

## Configuration

### Using the CLI Compiler

| Option          | Type       | Description |
|-----------------|------------|-------------|
| compilerPath    | `string`   | Optional.<br>The path to the kaitai compiler binary. |
| compilerFlags   | `string[]` | Optional.<br>Extra CLI flags to pass to the kaitai compiler. |
| compilerTimeout | `number`   | Optional.<br>A timeout for the compiler. |

### Using the Compiler API
> Note: See licensing info below

| Option     | Type       | Description |
|------------|------------|-------------|
| compiler   | `Compiler`   | Required.<br>The kaitai compiler. |
| fileLoader | `FileLoader` | Optional.<br>The file loader. |
| debug      | `boolean`    | Optional.<br>Create a debug build. |

For Example:

```js
import esbuild from 'esbuild';
import kaitaiLoader from 'esbuild-plugin-kaitai';
import KaitaiStructCompiler from 'kaitai-struct-compiler';

esbuild.build({
    ...
    plugins: [
        kaitaiLoader({
            compiler: new KaitaiStructCompiler(),
            debug: true
        })
    ]
    ...
});
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Extra Licensing Info

The reference Kaitai compiler, [`kaitai-struct-compiler`](https://github.com/kaitai-io/kaitai_struct_compiler), is licened under the GPL-3.0 license. In order to prevent license compatability issues, this project does not include or directly link to the kaitai compiler. As the user, you must provide the compiler program yourself. There are two ways you can do this:

### CLI Compiler (default)

   By default, this plugin will attempt to execute the Kaitai compiler program from the command line. Since the compiler runs as a separate program, this should avoid any licensing conflicts.

   1. [Download and Install the Kaitai Compiler from the Kaitai website.](https://kaitai.io/#download)

   2. Make sure the `kaitai-struct-compiler` program is in your PATH.

   If the Kaitai compiler is not in your PATH, you can specify it's location using the `compilerPath` configuration option or `KAITAI_PATH` environment variable.

### Compiler API

   You can also provide your own compiler via the `compiler` configuration option. You can either provide the reference compiler (In which case your build scrips might be subject to the GPL - don't ask me, I'm not a lawyer), or you can provide an alternative, API-compatable compiler.
