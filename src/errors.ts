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

/**
 * Default language error.
 */
export class CharonError extends Error {
  constructor(
    message?: string,
    public readonly origin: Optional<ast.CodeLocation> = null,
    public readonly cause: Optional<Error> = null)
  {
    super(message);
  }
}

/**
 * This exception is thrown when unhandled edge cases occur. This means that
 * there is a bug in the compiler.
 */
export class UnexpectedParseException extends CharonError {}

/**
 * Syntax errors occur when parsing the Charon source code, and encounter an
 * unknown token.
 */
export class SyntaxError extends CharonError {}

/**
 * This error is thrown when the compiler is able to detect purity violations
 * in function definitions.
 */
export class PurityViolationError extends CharonError {}

/**
 * This error is thrown when attempting to reference something unknown.
 */
export class ReferenceError extends CharonError {
  constructor(
    public reference: string,
    message?: string,
    origin: Optional<ast.CodeLocation> = null,
    cause: Optional<Error> = null)
  {
    super(message, origin, cause);
  }
}

/**
 * This error is thrown when a bad macro has been defined, and the compiler
 * is trying to expand it.
 * This might happen if a macro is defined using access expressions for
 * instance, which points to a bug in the compiler.
 */
export class BadMacroDefinition extends CharonError {}
