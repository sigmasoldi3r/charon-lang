/*
 * Charon compiler.
 */
import { readFileSync, fstat, writeFileSync } from 'fs';
import { Parser } from './Parser';
import * as ast from './ast';
import { createHash } from 'crypto';
import { join } from 'path';

type Optional<T> = null | T;

/**
 * Contextual nested key-svalue storage.
 */
export class Context<K, V> {
  constructor(private parent: Optional<Context<K, V>> = null) {}
  private store = new Map<K, V>();

  /**
   * Backtracks the key in the context tree, returns the first matching value.
   * @param key Key to lookup.
   */
  public get(key: K): Optional<V> {
    if (this.store.has(key)) return this.store.get(key) ?? null;
    return this.parent?.get(key) ?? null; 
  }

  /**
   * Sets the value on this context only.
   */
  public set(key: K, value: V) {
    this.store.set(key, value);
  }

  /**
   * Attempts to insert the value into the topmost context.
   * @param key
   * @param value
   */
  public setTop(key: K, value: V) {
    if (this.parent == null) {
      this.set(key, value);
    } else {
      this.parent.setTop(key, value);
    }
  }

  /**
   * Searches for the key in the context tree. Returns true if found at any
   * level of the tree, and thus can be retrieved by this.get(key: string).
   * @param key Key to find.
   */
  public has(key: K): boolean {
    return (this.store.has(key) || this.parent?.has(key)) ?? false;
  }
}

const HEADER = `require 'charon-runtime';
`;

enum DataKind {
  FUNC,
  IMPURE_FUNC,
  LOCAL,
  MACRO_FUNC
}
enum Scope {
  LOCAL,
  GLOBAL
}

interface DataPlace {
  name: string;
  original: string;
  kind: DataKind;
  scope: Scope;
}
const DEFAULT_DATA_PLACE: DataPlace = {
  name: '',
  original: '',
  kind: DataKind.FUNC,
  scope: Scope.LOCAL
};

function dataPlace(init: Partial<DataPlace> = {}) {
  return {...DEFAULT_DATA_PLACE, ...init};
}

type MacroFn = (name: string, args: ast.Term[]) => string;

function isCatch(term: ast.Term): boolean {
  return term.type === 'Invoke' && term.name.value === 'catch';
}

function not<A extends any[], R>(func: (...args: A) => R) {
  return (...args: A) => !func(...args);
}

function uniquePairs<T>(list: T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (const top of list) {
    for (const bot of list) {
      if (bot === top) continue;
      if (pairs.find(([l, r]) => l === bot && r === top) != null) continue;
      pairs.push([top, bot]);
    }
  }
  return pairs;
}

/**
 * Creates a mapping function that maps with the supplied function.
 * @param fn
 * @example let x = [ [1,2], [3,4] ];
 * x.map(forAll(x => x * 2));
 * // Yields [ [2,4], [6,8] ];
 */
function forAll<T extends U[], U, R>(fn: (u: U) => R) {
  return (iterable: T) => iterable.map(fn);
}

/**
 * Creates a function that accepts input for a and passes the result to b,
 * returns the overall.
 * @param a
 * @param b
 * @example function addOne(x: number) { return x + 1; }
 * function timesTwo(x: number) { return x * 2; }
 * const addOneAndTimesTwo = compose(addOne, timesTwo);
 * const n = addOneTimesTwo(2); // Yields 6 from (2 + 1) * 2
 */
function compose<T, U, R>(a: (t: T) => U, b: (u: U) => R) {
  return (t: T) => b(a(t));
}

/**
 * Creates a function that joins.
 * @param joiner
 * @example let x = [ ['a', 'b'], ['c', 'd'] ];
 * x.map(joining(':'));
 * // Yields [ 'a:b', 'c:d' ];
 */
function joining(joiner: string) {
  return (iterable: string[]) => iterable.join(joiner);
}

function thread(args: ast.Term[], applier: (term: ast.Term) => void): ast.Term {
  const first = args[0];
  let receiver = first;
  for (const fn of args.slice(1)) {
    if (!ast.isInvoke(fn)) throw `Only can thread through function calls!`;
    applier.apply(fn.args, [receiver]);
    receiver = fn;
  }
  return receiver;
}

/**
 * Creates a function invoke node.
 * @param value
 * @param args
 */
function invoke(value: string, ...args: ast.Term[]): ast.Invoke {
  return {
    type: 'Invoke',
    args,
    name: {
      type: 'Token',
      name: 'NAME',
      value
    }
  };
}

/**
 * Configurable compiler.
 */
export class Compiler extends Context<string, DataPlace> {
  static create() {
    const compiler = new Compiler();
    compiler.set('if', dataPlace({ name: '#if', kind: DataKind.MACRO_FUNC }));
    compiler.set('try', dataPlace({ name: '#try', kind: DataKind.MACRO_FUNC }));
    compiler.set('catch', dataPlace({ name: '#catch', kind: DataKind.MACRO_FUNC }));
    compiler.set('do', dataPlace({ name: '#do', kind: DataKind.MACRO_FUNC }));
    compiler.set('+', dataPlace({ name: '#plus', kind: DataKind.MACRO_FUNC }));
    compiler.set('-', dataPlace({ name: '#minus', kind: DataKind.MACRO_FUNC }));
    compiler.set('/', dataPlace({ name: '#div', kind: DataKind.MACRO_FUNC }));
    compiler.set('*', dataPlace({ name: '#mul', kind: DataKind.MACRO_FUNC }));
    compiler.set('^', dataPlace({ name: '#pow', kind: DataKind.MACRO_FUNC }));
    compiler.set('=', dataPlace({ name: '#eq', kind: DataKind.MACRO_FUNC }));
    compiler.set('<>', dataPlace({ name: '#neq', kind: DataKind.MACRO_FUNC }));
    compiler.set('>', dataPlace({ name: '#gt', kind: DataKind.MACRO_FUNC }));
    compiler.set('<', dataPlace({ name: '#lt', kind: DataKind.MACRO_FUNC }));
    compiler.set('>=', dataPlace({ name: '#gteq', kind: DataKind.MACRO_FUNC }));
    compiler.set('<=', dataPlace({ name: '#lteq', kind: DataKind.MACRO_FUNC }));
    compiler.set('and', dataPlace({ name: '#and', kind: DataKind.MACRO_FUNC }));
    compiler.set('or', dataPlace({ name: '#or', kind: DataKind.MACRO_FUNC }));
    compiler.set('not', dataPlace({ name: '#not', kind: DataKind.MACRO_FUNC }));
    compiler.set('nand', dataPlace({ name: '#nand', kind: DataKind.MACRO_FUNC }));
    compiler.set('nor', dataPlace({ name: '#nor', kind: DataKind.MACRO_FUNC }));
    compiler.set('xor', dataPlace({ name: '#xor', kind: DataKind.MACRO_FUNC }));
    compiler.set('->', dataPlace({ name: '#thread-first', kind: DataKind.MACRO_FUNC }));
    compiler.set('<-', dataPlace({ name: '#thread-last', kind: DataKind.MACRO_FUNC }));
    compiler.set('str', dataPlace({ name: '#string', kind: DataKind.MACRO_FUNC }));
    compiler.set('import', dataPlace({ name: '#import', kind: DataKind.MACRO_FUNC }));
    compiler.set('def-value', dataPlace({ name: '#def-value', kind: DataKind.MACRO_FUNC }));
    compiler.set('unit', dataPlace({ name: 'charon.Unit', kind: DataKind.LOCAL }));
    compiler.set('true', dataPlace({ name: 'charon.True', kind: DataKind.LOCAL }));
    compiler.set('false', dataPlace({ name: 'charon.False', kind: DataKind.LOCAL }));
    compiler.set('some?', dataPlace({ name: 'charon.some', kind: DataKind.FUNC }));
    compiler.set('vector/map', dataPlace({ name: 'charon.vector_map', kind: DataKind.FUNC }));
    compiler.set('atom', dataPlace({ name: 'charon.atom' }));
    compiler.set('atom/set!', dataPlace({ name: 'charon.atom_set', kind: DataKind.IMPURE_FUNC }));
    compiler.set('atom/get', dataPlace({ name: 'charon.atom_get', kind: DataKind.IMPURE_FUNC }));
    compiler.set('opaque-call', dataPlace({ name: 'charon.opaque_call' }));
    compiler.set('call', dataPlace({ name: 'charon.call' }));
    compiler.set('get', dataPlace({ name: 'charon.get' }));
    compiler.set('println', dataPlace({ name: 'charon.println', kind: DataKind.IMPURE_FUNC }));
    compiler.set('print', dataPlace({ name: 'charon.print', kind: DataKind.IMPURE_FUNC }));
    compiler.set('file/open', dataPlace({ name: 'charon.file_open', kind: DataKind.IMPURE_FUNC }));
    compiler.set('file/close', dataPlace({ name: 'charon.file_close', kind: DataKind.IMPURE_FUNC }));
    compiler.set('file/write', dataPlace({ name: 'charon.file_write', kind: DataKind.IMPURE_FUNC }));
    compiler.set('file/read', dataPlace({ name: 'charon.file_read', kind: DataKind.IMPURE_FUNC }));
    return compiler;
  }

  static compileFile(src: string, target: string = src.replace(/\..+$/, '.lua')) {
    const instance = Compiler.create();
    const out = instance.compile(readFileSync(src));
    writeFileSync(target, out);
  }

  private constructor(
    private readonly upper: Optional<Compiler> = null,
    private readonly pureContext: boolean = upper?.pureContext ?? false)
  {
    super(upper);
  }

  public target = 5.3;
  private readonly parser = new Parser();
  private readonly PKG = '__local_package';

  /**
   * Compiles the source code to target language.
   * @param input The source code to be compiled.
   */
  compile(input: string | Buffer) {
    const ast = this.parser.parse(input);
    const pack = `local ${this.PKG} = {};\n`;
    const srcOut = HEADER + pack + this.genProgram(ast).replace(/;;/g, ';');
    const main = this.get('main');
    if (main == null) {
      return srcOut + `\nreturn ${this.PKG};\n`;
    } else {
      if (main.kind !== DataKind.FUNC) throw 'Main function MUST be pure!';
      return srcOut + `\nreturn ${this.genScopedRef(main)}(charon.vector{...});\n`;
    }
  }

  private genProgram(program: ast.Program): string {
    return program.program.map(this.genInvoke.bind(this)).join(';\n');
  }

  private genInvoke(invoke: ast.Invoke): string {
    switch (invoke.name.value) {
      case 'def':
        return this.genDef(invoke, true);
      case 'def-impure':
        return this.genDef(invoke, false);
      case 'let':
        return this.genLet(invoke);
      default:
        return this.genFunctionInvoke(invoke);
    }
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
    const $ = new Compiler(this);
    const bind = $.genLetLocalBind(first);
    const body = [];
    for (const elem of invoke.args.slice(1)) {
      body.push($.genTerm(elem));
    }
    return `(function() ${bind}; ${body.join(';')} end)()`
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
  private genXOr(args: ast.Term[]): string {
    if (args.length === 0) throw `XOR function accepts at least one argument.`;
    if (args.length === 1) return this.genTerm(args[0]);
    let root = args[0];
    for (const term of args.slice(1)) {
      const a = invoke('and', invoke('not', root), term);
      const b = invoke('and', root, invoke('not', term));
      const or = invoke('or', a, b);
      root = or;
    }
    return this.genTerm(root);
  }

  private processMacro(name: string, args: ast.Term[]): string {
    const mapReduceArgs = (joiner: string) => {
      return uniquePairs(args)
        .map(
          compose(
            forAll(this.genTerm.bind(this)), joining(joiner)))
            .join(' and ')
    };
    switch (name) {
      case '#if': {
        const condition = this.genTerm(args[0]);
        const then = this.genTerm(args[1]);
        const otherwise = this.termListLastReturns(args.slice(2));
        return `(function() if ${condition} then return ${then}; else ${otherwise} end end)()`;
      }
      case '#do':
        return `(function() ${this.termListLastReturns(args)} end)()`;
      case '#try': {
        const catching = this.termListLastReturns(args.filter(isCatch));
        const trying = this.termListLastReturns(args.filter(not(isCatch)));
        return `(function() local _ok, _err = pcall(function() ${trying} end); if _ok then return _err; else ${catching} end end)()`;
      }
      case '#catch': {
        const binding = args[0];
        if (!ast.isVector(binding)) throw `Catch first argument must be a binding vector with one argument!`;
        const err = binding.list[0];
        if (!ast.isName(err)) throw `Catch's first binding element must be a name!`;
        const scope = new Compiler(this);
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
        const name = args[1];
        if (!ast.isName(name)) throw `Import second argument must be a name!`;
        const toImport = args[0];
        const local = this.registerVar(name, DataKind.LOCAL);
        return `local ${local.name} = require(${this.genTerm(toImport)});`;
      }
      case '#def-value': {
        if (this.pureContext) throw `Value definition cannot be done from pure context.`;
        const name = args[0];
        if (!ast.isName(name)) throw `def-value must start with a name!`;
        const val = args[1];
        const local = this.registerVar(name, DataKind.LOCAL, Scope.GLOBAL);
        return `${this.genScopedRef(local)} = ${this.genTerm(val)};`;
      }
    }
    const macro = this.getMacro(name);
    if (macro == null) throw `Undefined macro ${name}`;
    return macro(name, args); 
  }

  private genFunctionInvoke(invoke: ast.Invoke): string {
    const ref = this.get(invoke.name.value);
    if (ref == null) throw `Undefined reference to ${invoke.name.value}`;
    if (this.pureContext && ref.kind === DataKind.IMPURE_FUNC) {
      throw `Impure functions cannot be invoked from a pure context!`;
    }
    if (ref.kind === DataKind.MACRO_FUNC) {
      return this.processMacro(ref.name, invoke.args);
    }
    const args = invoke.args.map(this.genTerm.bind(this));
    return `${this.genScopedRef(ref)}(${args.join()})`;
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
      if (!ast.isName(arg)) throw 'Binding vector should contain only names for functions!';
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
    const $ = new Compiler(this, pure);
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

  private translateName(original: string): string {
    const got = this.get(original)
    if (got == null) throw `Unknown symbol ${original}`;
    return got.name;
  }

  private genTerm(term: ast.Term): string {
    switch (term.type) {
      case 'Vector': return this.genVector(term);
      case 'Table': return this.genTable(term);
      case 'Invoke': return this.genInvoke(term);
      case 'Token':
        switch (term.name) {
          case 'NAME': {
            const local = this.get(term.value);
            if (local == null) return this.translateName(term.value);
            return this.genScopedRef(local);
          }
          default:
            return term.value;
        }
    }
  }
}

Compiler.compileFile('samples/sample.crn');
Compiler.compileFile('samples/lib.crn');
