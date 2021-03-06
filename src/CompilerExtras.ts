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
/**
 * Additional functions that do not belong to the class, and constants or
 * configuration objects for the compiler.
 */

import { Optional } from "./Optional";
import * as ast from "./ast";
import { SyntaxError } from "./errors";

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
   * Attempts to get the value from the topmost context, ignoring the local
   * if not top.
   * @param key
   */
  public getTop(key: K): Optional<V> {
    if (this.parent == null) {
      return this.get(key);
    }
    return this.parent.getTop(key);
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

export enum DataKind {
  FUNC,
  IMPURE_FUNC,
  LOCAL,
  MACRO_FUNC,
}
export enum Scope {
  /**
   * A normal script-local scope.
   */
  LOCAL,
  /**
   * Package level scope.
   */
  PACKAGE,

  /**
   * Cross-package, global shared scope (AKA _G in most cases).
   */
  GLOBAL,
}

export interface DataPlace {
  name: string;
  original: string;
  kind: DataKind;
  scope: Scope;
  fallbackRef?: string;
}
export const DEFAULT_DATA_PLACE: DataPlace = {
  name: "",
  original: "",
  kind: DataKind.FUNC,
  scope: Scope.LOCAL,
};

export function dataPlace(init: Partial<DataPlace> = {}) {
  return { ...DEFAULT_DATA_PLACE, ...init };
}

export type MacroFn = (name: string, args: ast.Term[]) => string;

/**
 * Checks if the term is a catch block (catch [err] ...)
 * @param term
 */
export function isCatch(term: ast.Term): boolean {
  return (
    term.type === "Invoke" &&
    term.target.type === "Token" &&
    term.target.value === "catch"
  );
}

export function not<A extends any[], R>(func: (...args: A) => R) {
  return (...args: A) => !func(...args);
}

/**
 * Naive algorithm that generates unique pairs, where uniqueness is granted
 * as the combination of both ([A B] is the same as [B A]).
 * @param list
 */
export function uniquePairs<T>(list: T[]): [T, T][] {
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
export function forAll<T extends U[], U, R>(fn: (u: U) => R) {
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
export function compose<T, U, R>(a: (t: T) => U, b: (u: U) => R) {
  return (t: T) => b(a(t));
}

/**
 * Creates a function that joins.
 * @param joiner
 * @example let x = [ ['a', 'b'], ['c', 'd'] ];
 * x.map(joining(':'));
 * // Yields [ 'a:b', 'c:d' ];
 */
export function joining(joiner: string) {
  return (iterable: string[]) => iterable.join(joiner);
}

/**
 * Consumer type of applier.
 */
export type Applier = (term: ast.Term) => void;

/**
 * Generates the threading macro body (Expands the macro).
 * @param args
 * @param applier
 */
export function thread(args: ast.Term[], applier: Applier): ast.Term {
  const first = args[0];
  let receiver = first;
  for (const fn of args.slice(1)) {
    if (!ast.isInvoke(fn)) {
      throw new SyntaxError(
        `Only can thread through function calls!`,
        fn._location
      );
    }
    applier.apply(fn.args, [receiver]);
    receiver = fn;
  }
  return receiver;
}

export function threadParallel(
  invoke: ast.Invoke,
  args: ast.Term[],
  applier: Applier
): ast.List {
  const args0 = args[0];
  const list = args.slice(1).map((term) => {
    if (!ast.isInvoke(term)) {
      throw new SyntaxError(
        `Only can thread (parallel) through function calls!`,
        term._location
      );
    }
    applier.apply(term.args, [args0]);
    return term;
  });
  return {
    type: "List",
    _location: invoke._location,
    values: list,
  };
}

/**
 * This method replaces all characters in the stringified parameter as a
 * sequence of the first char found.
 * @param str
 * @example const s = r`^${x}`;
 * // If x was "abc", s is "^^^"
 */
export function r(str: TemplateStringsArray, target: string): string {
  const ch = str[0][0];
  return [...target].map((_) => ch).join("");
}

export function clamp(self: number, min: number, max: number) {
  return Math.min(Math.max(self, min), max);
}

/**
 * Creates a function invoke node.
 * @param value
 * @param args
 */
export function invoke(
  value: string,
  _location: ast.CodeLocation,
  ...args: ast.Term[]
): ast.Invoke {
  return {
    type: "Invoke",
    args,
    target: {
      type: "Token",
      name: "NAME",
      value,
      _location,
    },
    _location,
  };
}

function isLocated(object: any): object is ast.LocatedCode {
  return object._location != null;
}

/**
 * Generates the code mapping for each line.
 * @param location
 */
export function codeMap(
  out: string,
  location: ast.CodeLocation | ast.LocatedCode
) {
  const { start, end } = isLocated(location) ? location._location : location;
  return `${out} -- ${start.line}:${start.column},${end.line}:${end.column}\n`;
}

export type MetaSpecifier = "pure" | "impure";

/**
 * Returns true if the term/string is a valid MetaSpecifier.
 * @param term
 */
export function isMetaSpecifier(val: string): val is MetaSpecifier {
  return val === "pure" || val === "impure";
}

export interface CompileOptions {
  mode: "IIFE" | "function-module" | "module";
  varargIIFE: boolean;
  varargClosureBlocks: boolean;
  embedRuntime: boolean;
  noRuntimeRequire: boolean;
  globalExport: boolean;
}

/**
 * Presets for options.
 */
export const presets = {
  cli: {
    mode: "module",
    varargIIFE: false,
    varargClosureBlocks: true,
    embedRuntime: false,
    noRuntimeRequire: false,
    globalExport: false,
  } as CompileOptions,
  module: {
    mode: "module",
    varargIIFE: false,
    varargClosureBlocks: false,
    embedRuntime: false,
    noRuntimeRequire: false,
    globalExport: false,
  } as CompileOptions,
} as const;
