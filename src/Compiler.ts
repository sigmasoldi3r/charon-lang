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
import { readFileSync, writeFileSync } from 'fs';
import { Parser } from './Parser';
import * as ast from './ast';
import { createHash } from 'crypto';
import { Optional } from './Optional';
import {
  ReferenceError,
  BadMacroDefinition,
  SyntaxError,
  PurityViolationError,
  CharonError,
  TypeError,
  CompileError,
  formatCodeSlice,
  formatSourceLocation
} from './errors';
import {
  Context,
  CompileOptions,
  DataKind,
  DataPlace,
  forAll,
  not,
  compose,
  uniquePairs,
  presets,
  MacroFn,
  invoke,
  joining,
  isCatch,
  Scope,
  thread,
  dataPlace,
  threadParallel,
  isMetaSpecifier,
  MetaSpecifier
} from './CompilerExtras';
import { stdlib } from './CharonSTDDef';
import { version } from '../package.json';

/**
 * Configurable compiler context.
 */
export class Compiler extends Context<string, DataPlace> {
  /**
   * Creates a new instance with default runtime and macro bindings.
   * @param options
   */
  static create(options: CompileOptions) {
    const compiler = new Compiler(null, undefined, options);
    for (const key in stdlib) {
      compiler.set(key, stdlib[key as keyof typeof stdlib]);
    }
    return compiler;
  }

  /**
   * Compiles a single file.
   * @param src
   * @param target
   */
  static compileFile(src: string, target: string = src.replace(/\..+$/, '.lua'), options: Partial<CompileOptions> = {}) {
    const instance = Compiler.create({ ...presets.module, ...options });
    const out = instance.compile(readFileSync(src), src);
    writeFileSync(target, out);
  }

  private bug(what: string, context: string, location: ast.CodeLocation) {
    const tpl: Record<string, any> = {
      title: `[v${version}] Code generation fault at ${context}`,
      labels: `bug,codegen`,
      body: `## System information
\`\`\`
Compiler version v${version}
Platform ${process.platform}
\`\`\`

Context: ${context}

## Code check

Code that produced the issue:
\`\`\`clj
${this.code}
\`\`\`

Location: Line ${location.start.line}, column ${location.start.column}
Starts at \`${location.start.offset}\` and ends at \`${location.end.offset}\`

Please do not hesitate to provide additional steps for reproduction.

`
    };
    const args = Object.keys(tpl).map(k => `${k}=${encodeURIComponent(tpl[k])}`).join('&');
    const url = `https://github.com/sigmasoldi3r/charon-lang/issues/new?${args};`
    return `This likely indicates a bug in ${what}, please open an issue here ${url}\n`
  }

  /**
   * Lua target. Defaults to 5.3, a simple float.
   */
  public target: number;

  private skipNextStatementSeparator: boolean = false;

  private constructor(
    private readonly upper: Optional<Compiler> = null,
    private readonly pureContext: boolean = upper?.pureContext ?? false,
    private readonly options: CompileOptions) {
    super(upper);
    this.target = upper?.target ?? 5.3;
  }

  private readonly parser = new Parser();
  private _nsRef = '__local_package';
  private get nsRef() {
    if (this.upper == null) {
      return this._nsRef;
    } else {
      return this.upper.nsRef;
    }
  }
  private set nsRef(value: string) {
    if (this.upper == null) {
      this._nsRef = value;
    } else {
      this.upper.nsRef = value;
    }
  }
  private code = '';

  private genEmbedRuntime() {
    const rt = readFileSync('charon-runtime.lua')
      .toString()
      .replace(/(local charon.+?\n)/, '-- $1')
      .replace(/(return charon;)/, '-- $1');
    return (`\n${rt}`).replace(/\n/g, '\n  ');
  }

  private sourceName: string = '???';
  private _moduleName: Optional<string> = null;
  private get moduleName() {
    return this._moduleName;
  }
  private set moduleName(value: Optional<string>) {
    this._moduleName = value;
    const fallbackModule = this.sourceName.replace(/\.\w+?$/, '');
    if (this.options.globalExport) {
      this.nsRef = `_G["${this.moduleName ?? fallbackModule}"]`;
    }
  }

  /**
   * Compiles the source code to target language.
   * @param input The source code to be compiled.
   * @param sourceName The name of the source, for error reporting.
   */
  compile(input: string | Buffer, sourceName: string) {
    this.sourceName = sourceName;
    try {
      this.code = input.toString();
      const ast = this.parser.parse(input);
      const rt = (() => {
        if (this.options.embedRuntime) {
          return `local charon = {};\ndo${this.genEmbedRuntime()}\nend`;
        }
        if (this.options.noRuntimeRequire) {
          return '';
        }
        return `local charon = require 'charon-runtime';`;
      })();
      const fallbackModule = this.sourceName.replace(/\.\w+?$/, '');
      if (this.options.globalExport) {
        if (this.moduleName == null) {
          console.warn(`WARN: No module name defined for this global module, assuming "${fallbackModule}"`);
        }
        this.nsRef = `_G["${this.moduleName ?? fallbackModule}"]`;
      }
      const program = this.genProgram(ast).replace(/;;/g, ';');
      const header = (() => {
        if (this.options.globalExport) {
          return `${rt}\n${this.nsRef} = {};\n`;
        }
        return `${rt}\nlocal ${this.nsRef} = {};\n`;
      })();
      const srcOut = header + program;
      return srcOut + (() => {
        if (this.options.globalExport) {
          return `\n-- End module ${this.nsRef}`
        }
        return `\nreturn ${this.nsRef};\n`;
      })();
    } catch (err) {
      throw new CompileError(sourceName, input.toString(), err);
    }
  }

  private genProgram(program: ast.Program): string {
    return program.program.map(invoke => {
      let sep = ';';
      const src = this.genInvoke(invoke);
      if (this.skipNextStatementSeparator) {
        sep = '';
        this.skipNextStatementSeparator = false;
      }
      return src + sep;
    }).join('\n');
  }

  /**
   * Generates a local variable binding statement.
   * @param key
   * @param val
   * @param bind
   */
  private genNameBinding(key: ast.NAME, val: ast.Term): string {
    const bound = this.registerVar(key, DataKind.LOCAL);
    return `local ${bound.name} = ${this.genTerm(val)}`;
  }

  /**
   * Generates a nested destructuring assignment expression.
   * @param keys
   * @param bind
   */
  private genListDestructure(keys: ast.Term[], val: ast.Term, bind: string[], tail: string = '') {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const access = `${tail}[${i}]`;
      if (ast.isList(key)) {
        this.genListDestructure(key.values, val, bind, access);
      } else if (ast.isName(key)) {
        bind.push(this.genNameBinding(key, val) + access);
      } else {
        throw new SyntaxError(`Destructuring expressions can only contain names or destructuring expressions! found ${key.type}`, key._location);
      }
    }
  }

  /**
   * Generates the local value binding part of the let expression.
   * @param args
   */
  private genLetLocalBind(args: ast.List): String {
    const bind: string[] = []
    for (let i = 0; i < args.values.length; i += 2) {
      const key = args.values[i];
      if (!ast.isName(key) && !ast.isList(key)) {
        throw new SyntaxError(`Let binding pairs must start with names or destructuring expressions! found ${key.type}`, key._location);
      }
      const val = args.values[i + 1];
      if (ast.isName(key)) {
        bind.push(this.genNameBinding(key, val));
      } else {
        this.genListDestructure(key.values, val, bind);
      }
    }
    return bind.join(';')
  }

  private genLet(invoke: ast.Invoke): string {
    const first = invoke.args[0]
    if (!ast.isList(first)) throw 'First should be a binding array!';
    const $ = new Compiler(this, this.pureContext, this.options);
    const bind = $.genLetLocalBind(first);
    return `(function(${$.closure}) ${bind}; ${$.termListLastReturns(invoke.args.slice(1))} end)(${$.closure})`
  }

  private readonly macros = new Map<string, MacroFn>();

  /**
   * Gets defined macros, searches upper contexts if present.
   * @param name
   */
  private getMacro(name: string): Optional<MacroFn> {
    return this.macros.get(name) ?? this.upper?.getMacro(name) ?? null;
  }

  /**
   * Generates an n-ary xor operation.
   * @param args
   */
  private genXOr(args: ast.Term[], location: Optional<ast.CodeLocation> = null): string {
    if (args.length === 0)
      throw new SyntaxError(`XOR function accepts at least one argument.`, location);
    if (args.length === 1) return this.genTerm(args[0]);
    let root = args[0];
    for (const term of args.slice(1)) {
      const a = invoke('and', term._location, invoke('not', root._location, root), term);
      const b = invoke('and', root._location, root, invoke('not', term._location, term));
      const or = invoke('or', a._location, a, b);
      root = or;
    }
    return this.genTerm(root);
  }

  private get closure() {
    return this.options.varargClosureBlocks ? '...' : '';
  }

  /**
   * Processes a macro target.
   * @param invoke
   */
  private processMacro(invoke: ast.Invoke): string {
    if (!ast.isName(invoke.target)) {
      throw new BadMacroDefinition(`Attempting to expand macro with an invalid name! Symbols and access expressions are not allowed as macro names.`, invoke._location);
    }
    const { target: name, args } = invoke;
    const ref = this.getCheckedReference(name);
    switch (ref.name) {
      case '#defn':
        return this.genDefn(invoke, true);
      case '#defn!':
        return this.genDefn(invoke, false);
      case '#let':
        return this.genLet(invoke);
      case '#def': {
        if (this.pureContext) {
          throw new PurityViolationError(`Value definition cannot be done from pure context.`, invoke._location);
        }
        const name = args[0];
        if (!ast.isName(name)) {
          throw new SyntaxError(`def-value must start with a name!`, invoke._location);
        }
        const val = args[1];
        const local = this.registerVar(name, DataKind.LOCAL, Scope.PACKAGE);
        return `${this.genScopedRef(local)} = ${this.genTerm(val)};`;
      }
      case '#declare': {
        if (this.pureContext) {
          throw new PurityViolationError(`Extern definition cannot be done from pure context.`);
        }
        const meta: MetaSpecifier[] = [];
        const names = args.map(term => {
          if (!ast.isName(term) && !ast.isSymbol(term))
            throw new SyntaxError(`Only names and meta-specifiers are allowed in extern definitions!`);
          if (ast.isSymbol(term)) {
            const val = term.value;
            if (!isMetaSpecifier(val)) {
              throw new SyntaxError(`Unexpected meta-specifier found: "${term.value}"`, term._location);
            }
            if (meta.find(s => s === val)) {
              throw new TypeError(`${term.value} meta-specifier was already declared.`, term._location);
            }
            meta.push(term.value as any);
          }
          return term;
        });
        const data = names.filter(ast.isName).map(name => {
          const data = this.dataKindFromName(name);
          data.kind = DataKind.LOCAL;
          {
            const found = meta.find(s => s === 'pure' || s === 'impure');
            if (found != null) {
              data.kind = found === 'pure' ? DataKind.FUNC : DataKind.IMPURE_FUNC;
            }
          }
          data.scope = Scope.LOCAL;
          data.name = data.original;
          this.set(data.original, data);
          return data;
        });
        this.skipNextStatementSeparator = true;
        return `--[[ Extern symbol ${data.map(s => s.name).join()} {${meta.join()}} ]]`;
      }
      case '#three-dots':
        return `charon.list{...}`;
      case '#if': {
        const condition = this.genTerm(args[0]);
        const then = this.genTerm(args[1]);
        const otherwise = this.termListLastReturns(args.slice(2));
        return `(function(${this.closure}) if ${condition} then return ${then}; else ${otherwise} end end)(${this.closure})`;
      }
      case '#when':
        return this.genWhen(invoke, args);
      case '#do':
        return `(function(${this.closure}) ${this.termListLastReturns(args)} end)(${this.closure})`;
      case '#for': {
        return new Compiler(this, this.pureContext, this.options).genFor(invoke);
      }
      case '#fn': {
        const arg0 = args[0];
        if (!ast.isList(arg0))
          throw new SyntaxError(`Function expression's first argument must be a binding vector!`, invoke._location);
        const argInput = this.genBindingVector(arg0);
        return `(function() local __self_ref__; __self_ref__ = (function(${argInput}) ${this.termListLastReturns(args.slice(1))} end); return __self_ref__; end)()`;
      }
      case '#try': {
        const catching = this.termListLastReturns(args.filter(isCatch));
        const trying = this.termListLastReturns(args.filter(not(isCatch)));
        return `(function(${this.closure}) local _ok, _err = pcall(function(${this.closure}) ${trying} end${this.closure ? ', ' + this.closure : ''}); if _ok then return _err; else ${catching} end end)(${this.closure})`;
      }
      case '#catch': {
        const binding = args[0];
        if (!ast.isList(binding))
          throw new SyntaxError(`Catch first argument must be a binding vector with one argument!`);
        const err = binding.values[0];
        if (!ast.isName(err))
          throw new SyntaxError(`Catch's first binding element must be a name!`);
        const scope = new Compiler(this, undefined, this.options);
        const scopedErr = scope.registerVar(err, DataKind.LOCAL, Scope.LOCAL);
        const body = scope.termListLastReturns(args.slice(1));
        return `(function(${scope.genScopedRef(scopedErr)}) ${body} end)(_err)`;
      }
      case '#thread-first':
        return this.genTerm(thread(args, Array.prototype.unshift));
      case '#thread-last':
        return this.genTerm(thread(args, Array.prototype.push));
      case '#thread-parallel':
        return this.genTerm(threadParallel(invoke, args, Array.prototype.unshift));
      case '#thread-parallel-last':
        return this.genTerm(threadParallel(invoke, args, Array.prototype.push));
      case '#not':
        if (args.length != 1) {
          throw new SyntaxError(`not operator only accepts one argument.`, invoke._location);
        }
        return `(not ${this.genTerm(args[0])})`;
      case '#eq':
      case '#neq':
      case '#lt':
      case '#gt':
      case '#lteq':
      case '#gteq':
      case '#and':
      case '#or':
      case '#nand':
      case '#nor':
      case '#xor':
      case '#plus':
      case '#minus':
      case '#div':
      case '#mul':
      case '#pow':
        return this.genBOP(invoke, ref.name, args);
      case '#import':
        return this.genImport(args);
      case '#module': {
        if (args.length <= 0) {
          throw new SyntaxError(`Module declaration must contain at least the name of the module.`, invoke._location);
        }
        if (!ast.isName(args[0])) {
          throw new SyntaxError(`Module names should be valid identifiers, found ${args[0].type}`, args[0]._location);
        }
        const name = args[0].value;
        this.moduleName = name;
        let imports = '';
        if (args.length > 1) {
          imports = args.slice(1).map(term => {
            if (!ast.isList(term)) {
              throw new SyntaxError(`Module declaration tail arguments can only contain import lists.`, term._location);
            }
            if (term.values.length !== 2 && term.values.length !== 4) {
              throw new SyntaxError(`Module's import lists contains wrong number of arguments, expected 2 or 4.`, term._location);
            }
            const importSymbol = term.values[0];
            if (!ast.isSymbol(importSymbol) || importSymbol.value !== 'import') {
              throw new SyntaxError(`Import list first element must be :import!`, term._location);
            }
            return this.genImport(term.values.slice(1));
          }).join('\n');
        }
        return `-- Module ${name}\n${imports}`;
      }
    }
    const macro = this.getMacro(ref?.name ?? '');
    if (macro == null) {
      throw new ReferenceError(name.value, `Undefined macro ${name}`, invoke._location);
    }
    return macro(ref?.name ?? '', args);
  }

  /**
   * Generate the when statement.
   * @param invoke
   * @param args
   */
  private genWhen(invoke: ast.Invoke, args: ast.Term[]) {
    const condition = this.genTerm(args[0]);
    if ((args.length - 1) % 2 !== 0) {
      throw new SyntaxError(`When match expressions must be in pairs! Found stray key at the end of the block.`, invoke._location);
    }
    const cond: string[] = [];
    let elseFields: ast.Term[] = [];
    for (let i = 1; i < args.length; i += 2) {
      const key = args[i];
      if (ast.isName(key) && key.value === '_') {
        if (elseFields.length > 0) {
          console.warn(`WARN: Repeated fallback case on when!
  at ${formatSourceLocation(this.sourceName, key._location)}
${formatCodeSlice(this.code, key._location, 2)}`);
        }
        elseFields.push(args[i + 1]);
        continue;
      }
      const body = this.genTerm(args[i + 1]);
      if (ast.isList(key)) {
        // Destructured match case
        const match = key.values
          .map((value, key) => {
            return {
              key,
              value
            };
          })
          .filter(pair => pair.value.type !== 'Token' || pair.value.value !== '_')
          .map(pair => {
            return `${condition}[${pair.key}] == ${this.genTerm(pair.value)}`;
          })
          .join(' and ');
        const condExpr = `type(${condition}) == 'table' and ${match}`;
        const stmt = `if ${condExpr} then return ${body};`;
        cond.push(stmt);
      } else {
        // Equality check case
        const c = `${condition} == ${this.genTerm(key)}`;
        const stmt = `if ${c} then return ${body};`;
        cond.push(stmt);
      }
    }
    const elseExpr = elseFields.length === 0 ? '' : ` else ${this.termListLastReturns(elseFields)}`
    return `(function(${this.closure}) ${cond.join(' else')}${elseExpr} end end)(${this.closure})`;
  }

  /**
   * Generates the import code.
   * Named modules can use identifiers instead of strings, if desired.
   * @param args Must contain 1 or 3 items (import "...") or (import x :from "...")
   */
  private genImport(args: ast.Term[]): string {
    const targetOrBinder = args[0];
    if (ast.isString(targetOrBinder) || (ast.isName(targetOrBinder) && args.length === 1)) {
      return `require(${this.genTerm(targetOrBinder)});`
    }
    const from = args[1];
    if (!ast.isSymbol(from))
      throw new SyntaxError(`Import's second argument must be a symbol!`, from._location);
    if (from.value !== 'from')
      throw new SyntaxError(`Import's second argument is a symbol: expected ':from' but found ':${from.value}'`, from._location);
    const toImport = args[2];
    if (ast.isName(targetOrBinder)) {
      const local = this.registerVar(targetOrBinder, DataKind.LOCAL);
      return `local ${local.name} = require(${this.genTerm(toImport)});`;
    } else if (ast.isList(targetOrBinder)) {
      const src = this.genTerm(toImport);
      const names = targetOrBinder.values.map(t => {
        if (!ast.isName(t)) throw new SyntaxError(`Import binding vector expects names only.`, t._location);
        return t;
      });
      for (const term of names) {
        this.registerVar(term, DataKind.LOCAL, Scope.LOCAL);
      }
      const str = names.map(this.genTerm.bind(this));
      const bindDeclare = str.map(s => `local ${s};\n`).join('');
      const bind = names.map(s => `${this.genTerm(s)} = __package["${s.value}"];`).join('');
      return `${bindDeclare}do local __package = require(${src}); ${bind} end`
    } else {
      throw new SyntaxError(`Unexpected ${targetOrBinder.type} found as first import argument. Expecting name or binding vector.`, targetOrBinder._location);
    }
  }

  /**
   * Generates a binary-like operator such as +,-, or /...
   * @param invoke
   * @param modus
   * @param args
   */
  private genBOP(invoke: ast.Invoke, modus: string, args: ast.Term[]): string {
    if (args.length <= 1) {
      throw new SyntaxError(`Operator ${modus
        } needs at least two arguments!`, invoke._location);
    }
    const mapReduceArgs = (joiner: string) => {
      return uniquePairs(args)
        .map(
          compose(
            forAll(this.genTerm.bind(this)), joining(joiner)))
        .join(' and ');
    };
    const parsedArgs = args.map(this.genTerm.bind(this))
    switch (modus) {
      case '#eq':
        return `(${mapReduceArgs('==')})`;
      case '#neq':
        return `(${mapReduceArgs('~=')})`;
      case '#lt':
        return `(${mapReduceArgs('<')})`;
      case '#gt':
        return `(${mapReduceArgs('>')})`;
      case '#lteq':
        return `(${mapReduceArgs('<=')})`;
      case '#gteq':
        return `(${mapReduceArgs('>=')})`;
      case '#and':
        return `(${parsedArgs.join(' and ')})`;
      case '#or':
        return `(${parsedArgs.join(' or ')})`;
      case '#nand':
        return `(not (${parsedArgs.join(' and ')}))`;
      case '#nor':
        return `(not (${parsedArgs.join(' or ')}))`;
      case '#xor':
        return this.genXOr(args);
      case '#plus':
        return `(${parsedArgs.join('+')})`;
      case '#minus':
        return `(${parsedArgs.join('-')})`;
      case '#div':
        return `(${parsedArgs.join('/')})`;
      case '#mul':
        return `(${parsedArgs.join('*')})`;
      case '#pow':
        if (this.target < 5.3) {
          return parsedArgs.reduce((acc, curr) => `math.pow(${acc}, ${curr})`);
        } else {
          return `(${args.join('^')})`;
        }
      default:
        throw new CharonError(`Unknown binary-like operator "${modus
          }" passed. This is likely a bug in the parser, please issue a bug ${this.bug(
            'unexpected binary-like operator',
            'genBOP/switch',
            invoke._location
          )
          }`, invoke._location);
    }
  }

  /**
   * Generates the code for an optimized for binding.
   * @param invoke
   */
  private genFor(invoke: ast.Invoke): string {
    const { args } = invoke;
    const args0 = args[0];
    if (!ast.isList(args0)) {
      throw new SyntaxError(`For loop first argument must be a binding vector!`, args0._location);
    }
    if (args0.values.length < 2 || args0.values.length > 3) {
      throw new SyntaxError(`For loop binding vector must have either two or three arguments.`, args0._location);
    }
    const cardinal: 2 | 3 = args0.values.length as any;
    const v = args0.values[0];
    if (!ast.isName(v)) {
      throw new SyntaxError(`For loop binding vector's first argument must be a name!`, v._location);
    }
    this.registerVar(v, DataKind.LOCAL, Scope.LOCAL);
    const k = args0.values[1];
    if (cardinal === 3 && !ast.isName(k)) {
      throw new SyntaxError(`If looping in pairs the second argument (the key) must be also a name!`, v._location);
    }
    if (cardinal === 3 && ast.isName(k)) {
      this.registerVar(k, DataKind.LOCAL, Scope.LOCAL);
    }
    const iterable = cardinal === 3 ? args0.values[2] : k;
    let body: Optional<string> = null;
    const terms = args.slice(1).map(this.genTerm.bind(this)).join(';');
    if (cardinal === 3) {
      body = `for ${this.genTerm(k)}, ${this.genTerm(v)} in pairs(${this.genTerm(iterable)}) do ${terms} end`;
    } else if (ast.isInvoke(iterable) && ast.isName(iterable.target) && iterable.target.value === 'range') {
      body = `for ${this.genTerm(v)}=${iterable.args.map(this.genTerm.bind(this)).join(', ')} do ${terms} end`;
    } else {
      body = `for _, ${this.genTerm(v)} in pairs(${this.genTerm(iterable)}) do ${terms} end`;
    }
    if (body == null) {
      throw new CharonError(`Unexpected error while generating for loop code, the inline might have failed due to a false positive. This is likely a bug in the code generator, please report the issue here ${this.bug('the code generator', 'for inliner', invoke._location)
        }.`, invoke._location);
    }
    return `(function(${this.closure}) ${body} end)(${this.closure})`;
  }

  /**
   * Generates the code for an invoke expressions,
   * for example (some-func 3 2 "hi")
   * @param invoke
   */
  private genInvoke(invoke: ast.Invoke): string {
    if (ast.isSymbol(invoke.target)) {
      const maybeInt = Number.parseInt(invoke.target.value);
      if (Number.isNaN(maybeInt)) {
        const getter: ast.Invoke = {
          type: 'Invoke',
          target: {
            type: 'Token',
            name: 'NAME',
            value: 'table/get',
            _location: invoke.target._location
          },
          args: [
            invoke.target,
            ...invoke.args
          ],
          _location: invoke._location
        };
        return this.genInvoke(getter);
      } else {
        const getter: ast.Invoke = {
          type: 'Invoke',
          target: {
            type: 'Token',
            name: 'NAME',
            value: 'list/get',
            _location: invoke.target._location
          },
          args: [
            {
              name: 'NUMBER',
              type: 'Token',
              value: invoke.target.value
            } as ast.NUMBER,
            ...invoke.args
          ],
          _location: invoke._location
        };
        return this.genInvoke(getter);
      }
    } else if (ast.isName(invoke.target) || ast.isWildcard(invoke.target)) {
      const target = invoke.target;
      if (ast.isWildcard(target)) {
        if (target.value !== '#\'') {
          throw new SyntaxError(`Unexpected token ${target.value}`, target._location);
        }
        const args = invoke.args.map(term => {
          const out = this.genTerm(term);
          if (out[0] === '#') {
            return this.tryFallbackMacro(term);
          }
          return out;
        }).join();
        return `__self_ref__(${args})`;
      }
      const ref = this.getCheckedReference(target);
      if (this.pureContext && ref.kind === DataKind.IMPURE_FUNC) {
        throw new PurityViolationError(`Impure functions cannot be invoked from a pure context!`, invoke._location);
      }
      if (ref.kind === DataKind.MACRO_FUNC) {
        return this.processMacro(invoke);
      }
      const args = invoke.args.map(term => {
        const out = this.genTerm(term);
        if (out[0] === '#') {
          return this.tryFallbackMacro(term);
        }
        return out;
      }).join();
      return `${this.genScopedRef(ref)}(${args})`;
    } else if (ast.isAccessExpression(invoke.target)) {
      const target = this.genAccessExpression(invoke.target);
      const args = invoke.args.map(this.genTerm.bind(this));
      return `${target}(${args.join()})`;
    }
    throw new CharonError(`Attempting to generate a function call outside the boundaries of a valid target. ${this.bug('the code generator', 'generate call expression', invoke._location)}`, invoke._location);
  }

  /**
   * Attempts to provide a fallback functions for function-like macros like
   * arithmetic operations.
   * This is used when referencing such macros as functions, like in atom/apply!
   * or apply.
   * Throws syntax error if attempting to reference a non-function macro like
   * if, let or do.
   * @example (+ 1 1) ; Macro
   * @example (atom/apply! a + 1) ; Function reference
   * @param term
   */
  private tryFallbackMacro(term: ast.Term): string {
    if (!ast.isName(term)) {
      throw new CharonError(`Invalid use of fallback macro checker. This likely indicates a bug in the code generator, please issue this bug at ${this.bug('the code generator', 'fallback macro generation', term._location)}`);
    }
    const ref = this.get(term.value);
    const value = ref?.fallbackRef;
    if (value == null) {
      throw new CharonError(`Invalid use of fallback macro checker: No name found in the registry, or fallback not defined. Please issue this bug at ${this.bug('the code generator', 'fallback macro generation', term._location)}`);
    }
    return value;
  }

  /**
   * Generates code for object-field access expressions, such as:
   * @example (obj::static_field:method 1 2 3)
   * @param expr
   */
  private genAccessExpression(expr: ast.AccessExpression): string {
    const rootRef = this.getCheckedReference(expr.root);
    const root = this.genScopedRef(rootRef);
    const refChain = expr.segments.map(this.genAccessSegment.bind(this));
    return root + refChain.join('');
  }

  /**
   * Generates the segment of an access expression.
   * Access expressions have a root and segments, segments are always preceded
   * by either the bound reference operator ':' or unbound reference operator
   * '::'.
   * Example: 'a::b:c' where 'a' is the root, and '::b' and ':c' the segments.
   * Note that null-coalescing access expressions are not supported, but
   * reserved for possible future development.
   * @param segment
   */
  private genAccessSegment(segment: ast.AccessSegment): string {
    const name = segment.name.value;
    switch (segment.mode) {
      case ':': return `:${name}`;
      case '::': return `.${name}`;
      case '::?':
      case ':?':
        throw new SyntaxError(`Null-coalescing access expressions are not supported, reserved for a future use. Remove the '?' symbol.`, segment._location);
      default:
        throw new CharonError(`Unexpected state reached, '${segment.mode}' should not be here. This is likely a bug in the parser.`, segment._location);
    }
  }

  /**
   * Gets the reference and checks that exists. It will throw reference error if
   * the reference could not be found in this or parent contexts.
   * @param name
   */
  private getCheckedReference(name: ast.NAME): DataPlace {
    const { value: str } = name;
    const ref = this.get(str);
    if (ref == null) throw new ReferenceError(str, `Undefined reference to '${str}'`, name._location);
    return ref;
  }

  /**
   * Converts the name token into a data place, with name and source.
   * @remarks After that, kind and scope should be set.
   * @param param0 NAME token.
   */
  private dataKindFromName({ value: original }: ast.NAME, preserveName: boolean = false): DataPlace {
    if (preserveName) {
      return dataPlace({ original, name: original });
    }
    const name = '__val_' + createHash('md5')
      .update(original)
      .digest('hex')
      .toString()
      .slice(0, 8);
    return dataPlace({ original, name });
  }

  /**
   * Registers a new storage place (Variable/Function), if is global sends it to
   * the topmost context, else will register it as a local in this scope.
   * @param token
   * @param kind
   * @param scope
   */
  private registerVar(token: ast.NAME, kind: DataKind, scope: Scope = Scope.LOCAL, preserveName: boolean = false) {
    const data = this.dataKindFromName(token, preserveName);
    data.kind = kind;
    data.scope = scope;
    if (scope === Scope.PACKAGE) {
      const top = this.getTop(data.original);
      if (top != null && top.scope === Scope.PACKAGE) {
        console.log(top);
        throw new TypeError(`Attempting to redeclare ${data.original}!`, token._location);
      }
      this.setTop(data.original, data);
    }
    else this.set(data.original, data);
    return data;
  }

  /**
   * Generates the source code of the reference depending if is a local variable
   * or a package-level constant.
   * @param data
   */
  private genScopedRef(data: DataPlace): string {
    if (data.scope === Scope.PACKAGE) {
      return `${this.nsRef}["${data.original}"]`;
    } else if (data.scope === Scope.GLOBAL) {
      return `_G["${data.name}"]`;
    } else {
      return data.name;
    }
  }

  private genBindingVector(bind: ast.List): string {
    const args = [];
    for (const arg of bind.values) {
      if (!ast.isName(arg)) throw 'Binding vector should contain only names!';
      const local = this.registerVar(arg, DataKind.LOCAL);
      args.push(this.genScopedRef(local));
    }
    return args.join();
  }

  /**
   * Generates the function def code.
   * @param invoke
   * @param pure
   */
  private genDefn(invoke: ast.Invoke, pure: boolean): string {
    if (this.pureContext) throw 'Cannot define new functions inside a pure context!';
    if (invoke.args.length < 2) throw 'Too few args!';
    const name = invoke.args[0];
    if (!ast.isName(name)) throw 'First arg should be a name!';
    const bind = invoke.args[1];
    if (!ast.isList(bind)) throw 'Missing binding vector!';
    const firstSt = invoke.args[2];
    let local: DataPlace;
    if (ast.isSymbol(firstSt) && firstSt.value === 'global')
    {
      invoke.args.splice(2, 1);
      local = this.registerVar(name, pure ? DataKind.FUNC : DataKind.IMPURE_FUNC, Scope.GLOBAL, true);
    } else {
      local = this.registerVar(name, pure ? DataKind.FUNC : DataKind.IMPURE_FUNC, Scope.PACKAGE);
    }
    const $ = new Compiler(this, pure, this.options);
    let vArgs: null | ast.NAME = null;
    let shouldVArg = false
    const naturalArgs: ast.List = { type: 'List', values: [], _location: bind._location };
    for (const binder of bind.values) {
      if (shouldVArg && vArgs === null && binder.type === 'Token' && binder.name === 'NAME') {
        vArgs = binder;
      } else if (shouldVArg) {
        throw new SyntaxError(`Unexpected token after variadic binder. Only one name allowed after '&'.`, binder._location);
      }
      if (binder.type === 'Token' && binder.name === 'NAME' && binder.value === '&') {
        shouldVArg = true;
      }
      if (!shouldVArg) {
        naturalArgs.values.push(binder);
      }
    }
    const args = $.genBindingVector(naturalArgs);
    let vArgsCode = ''
    let spread = ''
    if (vArgs !== null) {
      const data = $.registerVar(vArgs, DataKind.LOCAL, Scope.LOCAL);
      vArgsCode = ` local ${data.name} = charon.list{...};`;
      if (naturalArgs.values.length > 0) {
        spread = ', ...'
      } else {
        spread = '...'
      }
    }
    return `${this.genScopedRef(local)} = (function() local __self_ref__; __self_ref__ = function(${args}${spread})${vArgsCode} ${$.genDefnBody(invoke)} end; return __self_ref__; end)()`;
  }

  private readonly DEFS = {
    'def': true,
    'defn': true,
    'defn!': true,
    'declare': true
  } as const;

  /**
   * Grabs a list of terms and joins them, making the last return.
   * Used in do, if and function bodies, as last term is always the return
   * result of any of those active blocks.
   * @param terms
   */
  private termListLastReturns(terms: ast.Term[]): string {
    const last = terms.length - 1;
    const out = [];
    let i = 0;
    for (const item of terms) {
      let eos = ';';
      const term = this.genTerm(item);
      if (this.skipNextStatementSeparator) {
        this.skipNextStatementSeparator = false;
        eos = '';
      }
      if (i++ === last) {
        if (ast.isInvoke(item) && ast.isName(item.target) && item.target.value in this.DEFS) {
          out.push(term + eos);
          out.push(`return charon.Unit;`);
        } else {
          out.push(`return ${term}${eos}`)
        }
      } else {
        out.push(term + eos);
      }
    }
    return out.join('');
  }

  /**
   * Generates the function definition body.
   * @param invoke
   */
  private genDefnBody(invoke: ast.Invoke): string {
    const list = invoke.args.slice(2);
    if (list.length === 0) return `return charon.Unit;`;
    return this.termListLastReturns(list);
  }

  /**
   * Generates the code of a table literal.
   * If the literal comes with a ' like '{:hi "you"}, symbols will be translated
   * into plain lua keys (AKA strings).
   * @param table
   */
  private genTable(table: ast.Table): string {
    const pairs: string[] = [];
    for (let i = 0; i < table.values.length; i += 2) {
      let l: string
      {
        const first = table.values[i]
        if (table.escaped && first.type == 'Token' && first.name == 'SYMBOL') {
          l = '"' + this.genTerm({ type: 'Token', name: 'STRING', value: first.value } as any) + '"';
        } else {
          l = this.genTerm(first);
        }
      }
      const r = this.genTerm(table.values[i + 1] ?? { type: 'Token', name: 'NAME', value: 'unit' });
      pairs.push(`[${l}] = ${r}`);
    }
    if (table.escaped) return `{ ${pairs.join()} }`;
    return `charon.table{ ${pairs.join()} }`;
  }

  private genList(list: ast.List): string {
    return `charon.list{ ${list.values.map(this.genTerm.bind(this)).join()} }`
  }

  private genSymbol(symbol: ast.SYMBOL): string {
    return `charon.symbol"${symbol.value}"`;
  }

  private translateName(original: string, location: ast.CodeLocation): string {
    return this.getCheckedReference({
      type: 'Token',
      name: 'NAME',
      value: original,
      _location: location
    }).name;
  }

  private genTerm(term: ast.Term): string {
    switch (term.type) {
      case 'List': return this.genList(term);
      case 'Table': return this.genTable(term);
      case 'Invoke': return this.genInvoke(term);
      case 'AccessExpression': {
        const found = term.segments.find(segment => segment.mode === ':' || segment.mode === ':?');
        if (found != null) {
          throw new SyntaxError(`Except for function calls, all property access must be unbounded (using the :: operator), expecting "${term.root.value}::${term.segments.map(s => s.name.value).join('::')}" but saw "${term.root.value}${term.segments.map(s => `${s.mode}${s.name.value}`)}"`, term._location);
        }
        return this.genAccessExpression(term);
      }
      case 'Token':
        switch (term.name) {
          case 'WILDCARD': throw new SyntaxError(`Unexpected wildcard symbol.`, term._location);
          case 'NAME': {
            const local = this.get(term.value);
            if (local == null) return this.translateName(term.value, term._location);
            return this.genScopedRef(local);
          }
          case 'SYMBOL':
            return this.genSymbol(term);
          default:
            return term.value.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        }
    }
  }
}
