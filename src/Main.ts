/*
 * Charon compiler.
 */
import { readFileSync, fstat, writeFileSync } from 'fs';
import { Parser } from './Parser';
import * as ast from './ast';
import { createHash } from 'crypto';

/**
 * Contextual nested key-svalue storage.
 */
export class Context {
  constructor(private parent: Context = null) {}
  private store = new Map<string, string>();

  /**
   * Backtracks the key in the context tree, returns the first matching value.
   * @param key Key to lookup.
   */
  public get(key: string): string | null {
    if (this.store.has(key)) return this.store.get(key);
    return this.parent?.get(key) ?? null; 
  }

  /**
   * Sets the value on this context only.
   */
  public set(key: string, value: string) {
    this.store.set(key, value);
  }

  /**
   * Attempts to insert the value into the topmost context.
   * @param key
   * @param value
   */
  public setTop(key: string, value: string) {
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
  public has(key: string): boolean {
    return (this.store.has(key) || this.parent?.has(key)) ?? false;
  }
}

const HEADER = `require 'charon-runtime';
`;

/**
 * Configurable compiler.
 */
export class Compiler extends Context {
  static create() {
    const compiler = new Compiler();
    compiler.set('+', 'charon.plus');
    compiler.set('-', 'charon.minus');
    compiler.set('/', 'charon.div');
    compiler.set('*', 'charon.mul');
    compiler.set('^', 'charon.pow');
    compiler.set('atom', 'charon.atom');
    compiler.set('set!', 'charon.set');
    compiler.set('get', 'charon.get');
    compiler.set('opaque-call', 'charon.opaque_call');
    compiler.set('println', 'charon.println');
    return compiler;
  }

  private constructor(parent: Context = null) {
    super(parent);
  }

  private readonly parser = new Parser();

  /**
   * 
   * @param input The source code to be compiled.
   */
  compile(input: string | Buffer) {
    const ast = this.parser.parse(input);
    const srcOut = HEADER + this.genProgram(ast).replace(/;;/g, ';');
    const main = this.get('main');
    return srcOut + `\n${main}(charon.vector{...});`;
  }

  private genProgram(program: ast.Program): string {
    return program.program.map(this.genInvoke.bind(this)).join(';\n');
  }

  private genInvoke(invoke: ast.Invoke): string {
    switch (invoke.name.value) {
      case 'def':
      case 'def-impure':
        return this.genDef(invoke);
      case 'let':
        return this.genLet(invoke);
      default:
        return this.genFunctionInvokation(invoke);
    }
  }

  private genLetLocalBind(args: ast.Vector): String {
    const bind = []
    for (let i = 0; i < args.list.length; i += 2) {
      const name = args.list[i];
      if (!ast.isName(name)) throw `Let binding pairs must start with names!`;
      const val = args.list[i + 1];
      this.registerName(name);
      bind.push(`local ${this.genTerm(name)} = ${this.genTerm(val)}`);
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
    return `do ${bind}; ${body.join(';')} end`
  }

  private genFunctionInvokation(invoke: ast.Invoke): string {
    const name = this.genTerm(invoke.name);
    const args = invoke.args.map(this.genTerm.bind(this)).join()
    return `${name}(${args})`;
  }

  private registerName({ value }: ast.NAME, top: boolean = false) {
    const name = '__val' + createHash('md5')
      .update(value)
      .digest('hex')
      .toString()
      .slice(0, 8);
    if (top) this.setTop(value, name);
    else this.set(value, name);
  }

  private genBindingVector(bind: ast.Vector): string {
    const args = [];
    for (const arg of bind.list) {
      if (!ast.isName(arg)) throw 'Binding vector should contain only names for functions!';
      this.registerName(arg);
      args.push(this.genTerm(arg));
    }
    return args.join();
  }

  private genDef(invoke: ast.Invoke): string {
    if (invoke.args.length < 2) throw 'Too few args!';
    const name = invoke.args[0];
    if (!ast.isName(name)) throw 'First arg should be a name!';
    const bind = invoke.args[1];
    if (!ast.isVector(bind)) throw 'Missing binding vector!';
    this.registerName(name, true);
    const $ = new Compiler(this);
    const args = $.genBindingVector(bind);
    return `${this.genTerm(name)} = function(${args}) ${$.genDefBody(invoke)} end;`;
  }

  private genDefBody(invoke: ast.Invoke): string {
    const list = invoke.args.slice(2);
    const last = list.length - 1;
    const out = [];
    let i = 0;
    for (const item of list) {
      if (i++ === last) {
        out.push(`return ${this.genTerm(item)};`)
      } else {
        out.push(this.genTerm(item));
      }
    }
    return out.join(';')
  }

  private genTable(table: ast.Table): string {
    return `charon.table{}`;
  }

  private genVector(vector: ast.Vector): string {
    return `charon.vector{}`
  }

  private translateName(original: string): string {
    const got = this.get(original)
    if (got == null) throw `Unknown symbol ${original}`;
    return got;
  }

  private genTerm(term: ast.Term): string {
    switch (term.type) {
      case 'Vector': return this.genVector(term);
      case 'Table': return this.genTable(term);
      case 'Invoke': return this.genInvoke(term);
      case 'Token':
        switch (term.name) {
          case 'NAME':
            return this.translateName(term.value);
          default:
            return term.value;
        }
    }
  }
}

const compiler = Compiler.create();
const out = compiler.compile(readFileSync('sample.cljs'));
writeFileSync('sample.lua', out);
