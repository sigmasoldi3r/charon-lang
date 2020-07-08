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
import { ReferenceError, BadMacroDefinition, SyntaxError, PurityViolationError, CharonError } from './errors';
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
  r
} from './CompilerExtras';
import { stdlib } from './CharonSTDDef';

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
    const instance = Compiler.create({ ...presets.module ,...options });
    const out = instance.compile(readFileSync(src), src);
    writeFileSync(target, out);
  }

  /**
   * Lua target. Defaults to 5.3, a simple float.
   */
  public target: number;
  
  private constructor(
    private readonly upper: Optional<Compiler> = null,
    private readonly pureContext: boolean = upper?.pureContext ?? false,
    private readonly options: CompileOptions)
  {
    super(upper);
    this.target = upper?.target ?? 5.3;
  }

  private readonly parser = new Parser();
  private readonly PKG = '__local_package';

  /**
   * Compiles the source code to target language.
   * @param input The source code to be compiled.
   * @param sourceName The name of the source, for error reporting.
   */
  compile(input: string | Buffer, sourceName: string) {
    const ast = this.parser.parse(input);
    const rt = this.options.embedRuntime
      ? `local charon = (function()${('\n' + readFileSync('charon-runtime.lua').toString()).replace(/\n/g, '\n  ')}\nend)();`
      : `local charon = require 'charon-runtime';`
      ;
    const header = `${rt}\nlocal ${this.PKG} = {};\n`;
    try {
      const srcOut = header + this.genProgram(ast).replace(/;;/g, ';');
      return srcOut + `\nreturn ${this.PKG};\n`;
    } catch (err) {
      if (err instanceof CharonError) {
        const { line, column } = err.origin?.start ?? { line: null, column: null };
        const [before, sub, after] = (() => {
          if (err.origin == null) return ['', '<unknown>', ''];
          const { start, end } = err.origin;
          const s = Math.max(start.offset - 16, 0);
          const e = Math.min(end.offset + 16, input.length);
          const before = input.toString().slice(s, start.offset);
          const after = input.toString().slice(end.offset, e);
          return [
            before.slice(Math.max(0, before.indexOf('\n') + 1), before.length),
            input.toString().slice(start.offset, end.offset),
            after.slice(0, Math.min(after.length, after.lastIndexOf('\n')))
          ];
        })();
        throw new CharonError(`Could not compile source code.
${sourceName}:${line}:${column}
      ${before}${sub}${after}
      ${r` ${before}`}${r`^${sub}`}
${err}`, err.origin, err);
      } else {
        throw new CharonError(`Could not compile source code.
Caused by ${err}`, null, err);
      }
    }
  }

  private genProgram(program: ast.Program): string {
    return program.program.map(this.genInvoke.bind(this)).join(';\n');
  }

  private genLetLocalBind(args: ast.Vector): String {
    const bind = []
    for (let i = 0; i < args.list.length; i += 2) {
      const name = args.list[i];
      if (!ast.isName(name)) throw `Let binding pairs must start with names!`;
      const val = args.list[i + 1];
      const imported = this.registerVar(name, DataKind.LOCAL);
      bind.push(`local ${imported.name} = ${this.genTerm(val)}`);
    }
    return bind.join(';')
  }

  private genLet(invoke: ast.Invoke): string {
    const first = invoke.args[0]
    if (!ast.isVector(first)) throw 'First should be a binding array!';
    const $ = new Compiler(this, undefined, this.options);
    const bind = $.genLetLocalBind(first);
    const body = [];
    for (const elem of invoke.args.slice(1)) {
      body.push($.genTerm(elem));
    }
    return `(function(${this.closure}) ${bind}; ${body.join(';')} end)(${this.closure})`
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

  private processMacro(invoke: ast.Invoke): string {
    if (!ast.isName(invoke.target))
      throw new BadMacroDefinition(`Attempting to expand macro with an invalid name! Symbols and access expressions are not allowed as macro names.`, invoke._location);
    const { target: name, args } = invoke;
    const ref = this.getCheckedReference(name);
    const mapReduceArgs = (joiner: string) => {
      return uniquePairs(args)
        .map(
          compose(
            forAll(this.genTerm.bind(this)), joining(joiner)))
            .join(' and ')
    };
    switch (ref.name) {
      case '#def':
          return this.genDef(invoke, true);
      case '#def-impure':
          return this.genDef(invoke, false);
      case '#let':
          return this.genLet(invoke);
      case '#apply':
          return '';
      case '#three-dots':
        return `charon.vector{...}`;
      case '#if': {
        const condition = this.genTerm(args[0]);
        const then = this.genTerm(args[1]);
        const otherwise = this.termListLastReturns(args.slice(2));
        return `(function(${this.closure}) if ${condition} then return ${then}; else ${otherwise} end end)(${this.closure})`;
      }
      case '#do':
        return `(function(${this.closure}) ${this.termListLastReturns(args)} end)(${this.closure})`;
      case '#fn':{
        const arg0 = args[0];
        if (!ast.isVector(arg0))
          throw new SyntaxError(`Function expression's first argument must be a binding vector!`);
        const argInput = this.genBindingVector(arg0);
        return `(function(${argInput}) ${this.termListLastReturns(args.slice(1))} end)`;
      }
      case '#try': {
        const catching = this.termListLastReturns(args.filter(isCatch));
        const trying = this.termListLastReturns(args.filter(not(isCatch)));
        return `(function(${this.closure}) local _ok, _err = pcall(function(${this.closure}) ${trying} end${this.closure ? ', '+this.closure : ''}); if _ok then return _err; else ${catching} end end)(${this.closure})`;
      }
      case '#catch': {
        const binding = args[0];
        if (!ast.isVector(binding))
          throw new SyntaxError(`Catch first argument must be a binding vector with one argument!`);
        const err = binding.list[0];
        if (!ast.isName(err))
          throw new SyntaxError(`Catch's first binding element must be a name!`);
        const scope = new Compiler(this, undefined, this.options);
        const scopedErr = scope.registerVar(err, DataKind.LOCAL, Scope.LOCAL);
        const body = scope.termListLastReturns(args.slice(1));
        return `(function(${scope.genScopedRef(scopedErr)}) ${body} end)(_err)`;
      }
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
      case '#thread-first':
        return this.genTerm(thread(args, Array.prototype.unshift));
      case '#thread-last':
        return this.genTerm(thread(args, Array.prototype.push));
      case '#and':
        return `(${args.map(this.genTerm.bind(this)).join(' and ')})`;
      case '#or':
        return `(${args.map(this.genTerm.bind(this)).join(' or ')})`;
      case '#nand':
        return `(not (${args.map(this.genTerm.bind(this)).join(' and ')}))`;
      case '#nor':
        return `(not (${args.map(this.genTerm.bind(this)).join(' or ')}))`;
      case '#xor':
        return this.genXOr(args);
      case '#not':
        if (args.length != 1) throw `not operator only accepts one argument.`;
        return `(not ${this.genTerm(args[0])})`;
      case '#plus':
        return `(${args.map(this.genTerm.bind(this)).join('+')})`;
      case '#minus':
        return `(${args.map(this.genTerm.bind(this)).join('-')})`;
      case '#div':
        return `(${args.map(this.genTerm.bind(this)).join('/')})`;
      case '#mul':
        return `(${args.map(this.genTerm.bind(this)).join('*')})`;
      case '#pow':
        if (this.target < 5.3) {
          return args.map(this.genTerm.bind(this)).reduce((acc, curr) => `math.pow(${acc}, ${curr})`);
        } else {
          return `(${args.join('^')})`;
        }
      case '#import': {
        const targetOrBinder = args[0];
        const from = args[1];
        if (!ast.isSymbol(from))
          throw new SyntaxError(`Import's second argument must be a symbol!`, from._location);
        if (from.value !== 'from')
          throw new SyntaxError(`Import's second argument is a symbol: expected ':from' but found ':${from.value}'`, from._location);
        const toImport = args[2];
        if (ast.isName(targetOrBinder)) {
          const local = this.registerVar(targetOrBinder, DataKind.LOCAL);
          return `local ${local.name} = require(${this.genTerm(toImport)});`;
        } else if (ast.isVector(targetOrBinder)) {
          const src = this.genTerm(toImport);
          const names = targetOrBinder.list.map(t => {
            if (!ast.isName(t)) throw new SyntaxError(`Import binding vector expects names only.`, t._location);
            return t;
          });
          for (const term of names) {
            this.registerVar(term, DataKind.LOCAL, Scope.LOCAL);
          }
          const str = names.map(this.genTerm.bind(this));
          const bindDeclare = str.map(s => `local ${s};\n`).join('');
          const bind = names.map(s => `${this.genTerm(s)} = __package["${s.value}"];`);
          return `${bindDeclare}do local __package = require(${src}); ${bind} end`
        } else {
          throw new SyntaxError(`Unexpected ${targetOrBinder.type} found as first import argument. Expecting name or binding vector.`, targetOrBinder._location);
        }
      }
      case '#def-value': {
        if (this.pureContext) throw `Value definition cannot be done from pure context.`;
        const name = args[0];
        if (!ast.isName(name)) throw `def-value must start with a name!`;
        const val = args[1];
        const local = this.registerVar(name, DataKind.LOCAL, Scope.GLOBAL);
        return `${this.genScopedRef(local)} = ${this.genTerm(val)};`;
      }
      case '#def-extern': {
        if (this.pureContext)
          throw new PurityViolationError(`Extern definition cannot be done from pure context.`);
        const names = args.map(term => {
          if (!ast.isName(term))
            throw new SyntaxError(`Only names are allowed in extern definitions!`);
          return term
        });
        const data = names.map(name => {
          const data = this.dataKindFromName(name)
          data.kind = DataKind.LOCAL;
          data.scope = Scope.LOCAL;
          data.name = data.original;
          this.set(data.original, data);
          return data;
        });
        return `-- Extern symbol ${data.map(s => s.name).join()}`;
      }
    }
    const macro = this.getMacro(ref?.name ?? '');
    if (macro == null) throw `Undefined macro ${name}`;
    return macro(ref?.name ?? '', args); 
  }

  /**
   * Generates the code for an invoke expressions,
   * for example (some-func 3 2 "hi")
   * @param invoke
   */
  private genInvoke(invoke: ast.Invoke): string {
    if (ast.isSymbol(invoke.target)) {
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
    }
    if (ast.isName(invoke.target)) {
      const ref = this.getCheckedReference(invoke.target);
      if (this.pureContext && ref.kind === DataKind.IMPURE_FUNC) {
        throw new PurityViolationError(`Impure functions cannot be invoked from a pure context!`);
      }
      if (ref.kind === DataKind.MACRO_FUNC) {
        return this.processMacro(invoke);
      }
      const args = invoke.args.map(this.genTerm.bind(this)).join();
      return `${this.genScopedRef(ref)}(${args})`;
    }
    const args = invoke.args.map(this.genTerm.bind(this)).join();
    const access = this.genAccessExpression(invoke.target);
    return `${access}(${args})`;
  }

  private genAccessExpression(expr: ast.AccessExpression): string {
    const rootRef = this.getCheckedReference(expr.root);
    const root = this.genScopedRef(rootRef);
    const refChain = expr.segments.map(this.genAccessSegment.bind(this));
    return root + refChain.join('');
  }

  private readonly accessModeTable = {
    ':': ':',
    '::': '.',
    '::?': '.',
    ':?': ':'
  } as const;

  private genAccessSegment(segment: ast.AccessSegment): string {
    // const name = this.getCheckedReference(segment.name);
    return this.accessModeTable[segment.mode] + segment.name.value;
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
  private dataKindFromName({ value: original }: ast.NAME): DataPlace {
    const name = '__val_' + createHash('md5')
      .update(original)
      .digest('hex')
      .toString()
      .slice(0, 8);
    return dataPlace({ original, name });
  }

  /**
   * Registers a new storage place (Variable/Function).
   * @param token
   * @param kind
   * @param scope
   */
  private registerVar(token: ast.NAME, kind: DataKind, scope: Scope = Scope.LOCAL) {
    const data = this.dataKindFromName(token);
    data.kind = kind;
    data.scope = scope;
    if (scope === Scope.GLOBAL) this.setTop(data.original, data);
    else this.set(data.original, data);
    return data;
  }

  private genScopedRef(data: DataPlace): string {
    if (data.scope === Scope.GLOBAL) {
      return `${this.PKG}["${data.original}"]`;
    } else {
      return data.name;
    }
  }

  private genBindingVector(bind: ast.Vector): string {
    const args = [];
    for (const arg of bind.list) {
      if (!ast.isName(arg)) throw 'Binding vector should contain only names!';
      const local = this.registerVar(arg, DataKind.LOCAL);
      args.push(this.genScopedRef(local));
    }
    return args.join();
  }

  private genDef(invoke: ast.Invoke, pure: boolean): string {
    if (this.pureContext) throw 'Cannot define new functions inside a pure context!';
    if (invoke.args.length < 2) throw 'Too few args!';
    const name = invoke.args[0];
    if (!ast.isName(name)) throw 'First arg should be a name!';
    const bind = invoke.args[1];
    if (!ast.isVector(bind)) throw 'Missing binding vector!';
    const local = this.registerVar(name, pure ? DataKind.FUNC : DataKind.IMPURE_FUNC, Scope.GLOBAL);
    const $ = new Compiler(this, pure, this.options);
    const args = $.genBindingVector(bind);
    return `${this.genScopedRef(local)} = function(${args}) ${$.genDefBody(invoke)} end;`;
  }

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
      if (i++ === last) {
        out.push(`return ${this.genTerm(item)};`)
      } else {
        out.push(this.genTerm(item));
      }
    }
    return out.join(';')
  }

  private genDefBody(invoke: ast.Invoke): string {
    const list = invoke.args.slice(2);
    return this.termListLastReturns(list);
  }

  private genTable(table: ast.Table): string {
    const pairs: string[] = [];
    for (let i = 0; i < table.list.length; i += 2) {
      const l = this.genTerm(table.list[i]);
      const r = this.genTerm(table.list[i + 1] ?? { type: 'Token', name: 'NAME', value: 'unit' });
      pairs.push(`[${l}] = ${r}`);
    }
    return `charon.table{ ${pairs.join()} }`;
  }

  private genVector(vector: ast.Vector): string {
    return `charon.vector{ ${vector.list.map(this.genTerm.bind(this)).join()} }`
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
      case 'Vector': return this.genVector(term);
      case 'Table': return this.genTable(term);
      case 'Invoke': return this.genInvoke(term);
      case 'AccessExpression': return this.genAccessExpression(term);
      case 'Token':
        switch (term.name) {
          case 'NAME': {
            const local = this.get(term.value);
            if (local == null) return this.translateName(term.value, term._location);
            return this.genScopedRef(local);
          }
          case 'SYMBOL':
            return this.genSymbol(term);
          default:
            return term.value;
        }
    }
  }
}
