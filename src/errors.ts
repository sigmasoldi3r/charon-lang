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
