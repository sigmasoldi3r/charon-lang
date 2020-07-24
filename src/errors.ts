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
 * Language and compile errors.
 */
import { Optional } from './Optional';
import * as ast from './ast';
import { r } from './CompilerExtras';

export type LocatableError = Error & { location?: ast.CodeLocation };

/**
 * Returns a string with the slice of code that the given location represents.
 * @param code
 * @param location
 */
export function formatCodeSlice(code: String | Buffer, location: ast.CodeLocation, indent: number = 0) {
  const [before, sub, after] = (() => {
    const { start, end } = location;
    const s = Math.max(start.offset - 16, 0);
    const e = Math.min(end.offset + 16, code.length);
    const before = code.toString().slice(s, start.offset);
    const after = code.toString().slice(end.offset, e);
    return [
      before.slice(Math.max(0, before.indexOf('\n') + 1), before.length),
      code.toString().slice(start.offset, end.offset),
      after.slice(0, Math.min(after.length, after.lastIndexOf('\n')))
    ];
  })();
  return `${' '.repeat(indent)}${before}${sub}${after}
${' '.repeat(indent)}${r` ${before}`}${r`^${sub}`}`;
}

/**
 * Takes an optional source location and a source name and outputs it's name
 * with line and column.
 * @param sourceName
 * @param location
 */
export function formatSourceLocation(sourceName: string, location: Optional<ast.CodeLocation>) {
  const { line, column } = location?.start ?? { line: null, column: null };
  return `${sourceName}:${line}:${column}`;
}

/**
 * This error is a wrapper for compilation failures due to thrown exceptions.
 */
export class CompileError extends Error {
  constructor(
    source: string,
    input: string,
    public readonly cause: Error
  ) {
    super(CompileError.format(cause, source, input));
  }

  /**
   * Formats the error nicely so hints in the source code are shown.
   * @param sourceName
   * @param input
   */
  public static format(cause: LocatableError, sourceName: string, input: string) {
    const location = (() => {
      if (cause instanceof CharonError) {
        return cause.origin;
      }
      if (cause.location != null) {
        return cause.location;
      }
      return null;
    })();
    return `${formatSourceLocation(sourceName, location)}
${location == null ? '<could not locate source>' : formatCodeSlice(input, location, 2)}
${cause.name}: ${cause.message}`;
  }
}

/**
 * Default language error.
 */
export class CharonError extends Error {
  constructor(
    message?: string,
    public readonly origin: Optional<ast.CodeLocation> = null,
    public readonly cause: Optional<Error> = null) {
    super(message);
    this.name = 'CharonError';
  }
}

/**
 * This exception is thrown when unhandled edge cases occur. This means that
 * there is a bug in the compiler.
 */
export class UnexpectedParseException extends CharonError {
  name = 'UnexpectedParseException';
}

/**
 * Syntax errors occur when parsing the Charon source code, and encounter an
 * unknown token.
 */
export class SyntaxError extends CharonError {
  name = 'SyntaxError';
}

/**
 * Type errors occur when well-known types are checked at compile time, or when
 * a declaration violation occurs (Such as redeclarating the same term twice).
 */
export class TypeError extends CharonError {
  name = 'TypeError';
}

/**
 * This error is thrown when the compiler is able to detect purity violations
 * in function definitions.
 */
export class PurityViolationError extends CharonError {
  name = 'PurityViolationError';
}

/**
 * This error is thrown when attempting to reference something unknown.
 */
export class ReferenceError extends CharonError {
  constructor(
    public reference: string,
    message?: string,
    origin: Optional<ast.CodeLocation> = null,
    cause: Optional<Error> = null) {
    super(message, origin, cause);
    this.name = 'ReferenceError';
  }
}

/**
 * This error is thrown when a bad macro has been defined, and the compiler
 * is trying to expand it.
 * This might happen if a macro is defined using access expressions for
 * instance, which points to a bug in the compiler.
 */
export class BadMacroDefinition extends CharonError {
  name = 'BadMacroDefinition';
}
