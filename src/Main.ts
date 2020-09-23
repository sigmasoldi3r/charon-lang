/*
MIT License

Copyright (c) 2020 Pablo Blanco Celdrán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/*
 * Charon compiler.
 */
import { Compiler } from './Compiler';
import * as yargs from 'yargs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as cp from 'child_process';
import { EntryPoint } from './exec';
import { version } from '../package.json';
import { writeFileSync, readFileSync } from 'fs';
import { CharonError, CompileError } from './errors';

/**
 * Entry point class.
 */
export default class Main {
  private constructor() { }

  /**
   * App main.
   * CLI entry point.
   */
  @EntryPoint
  static main() {
    const args = yargs
      .example('charon [file] [-o out/file.lua]', 'Compiles a single file.')
      .option('output', {
        alias: 'o',
        required: false,
        type: 'string',
        describe: 'Output file, optional.'
      })
      .option('embed-runtime', {
        alias: 'e',
        type: 'boolean',
        default: false,
        describe: 'Embeds the runtime instead of requiring it. Use for standalone environments.'
      })
      .option('extract-runtime', {
        alias: 'x',
        type: 'boolean',
        default: false,
        describe: 'Extracts the runtime to make it available in your local environment.'
      })
      .option('global-export', {
        alias: 'g',
        default: false,
        type: 'boolean',
        describe: 'Treats all exported modules as global symbols, including charon runtime.'
      })
      .option('no-runtime', {
        alias: 'n',
        default: false,
        type: 'boolean',
        describe: 'Makes compiled modules not require charon runtime explicitly.'
      })
      .option('variadic-closures', {
        default: false,
        type: 'boolean',
        alias: 's',
        describe: 'Makes all immediate closures variadic (if, do and such blocks).'
      })
      .option('run', {
        default: false,
        type: 'boolean',
        alias: 'u',
        describe: 'Runs the script instead of compiling it.'
      })
      // Options to be implemented:
      .option('type', {
        default: 'module',
        type: 'string',
        alias: 't',
        describe: 'Compilation mode, will tell how the file is produced. CURRENTLY SUPPORTS MODULE ONLY!'
      })
      .option('config', {
        alias: 'c',
        required: false,
        type: 'string',
        describe: 'Configuration file for batch compile of projects. NOT USED CURRENTLY.'
      })
      .version(version)
      .argv;
    if (args["extract-runtime"]) {
      console.log('Extracting runtime to current working directory...');
      let src: Buffer | string = readFileSync('charon-runtime.lua');
      if (args["global-export"]) {
        src = src.toString()
          .replace(/local (charon.+?\n)/, '$1')
          .replace(/(return charon;)/, '-- $1');
      }
      writeFileSync('charon-runtime.lua', src);
      // Prevent error when using only extract runtime.
      if (args._.length === 0) return 0;
    }
    if (args._.length === 0) {
      console.error('No input file provided! use --help for usage.');
      return 1;
    }
    if (args["run"]) {
      if (args["output"]) {
        console.warn('Output flag provided, but run being called. Ignoring it.');
      }
      const frag = crypto.createHash('md5')
        .update(new Date().toString())
        .digest()
        .toString('hex');
      args["output"] = `__tmpcharonrt${frag}__.lua`
    }
    try {
      Compiler.compileFile(args._[0], args.output, {
        varargClosureBlocks: args["variadic-closures"],
        embedRuntime: args["embed-runtime"],
        mode: args.type as any,
        noRuntimeRequire: args["no-runtime"],
        globalExport: args["global-export"]
      });
      if (args["run"]) {
        console.log(cp.execSync(`lua ${args["output"]}`).toString());
      }
    } catch (err) {
      if (err instanceof CompileError) {
        console.error(err.message);
        if (err.cause instanceof CharonError && err.cause.cause != null) {
          console.error(err.cause.cause.message);
        }
      } else {
        console.error(err);
      }
      return 2;
    } finally {
      if (args["run"] && args["output"]) {
        fs.unlinkSync(args["output"]);
      }
    }
    return 0;
  }
}
