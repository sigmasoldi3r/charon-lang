/*
 * Parser module.
 */
import * as ast from './ast';
import { parse } from './charon.generated';

/**
 * Configurable parser.
 */
export class Parser {
  /**
   * @param options Parser options.
   */
  constructor(private options: any = {}) {}

  /**
   * Parses the input file.
   * @param input Source code to be parsed.
   * @param options Additional parser options.
   */
  parse(input: string | Buffer, options: any = {}): ast.Program {
    return parse(input.toString(), {...this.options, ...options}) as any;
  }
}
