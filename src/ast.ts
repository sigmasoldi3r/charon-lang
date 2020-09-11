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
// Abstract syntax tree definitions

export function isAccessExpression(term: Term): term is AccessExpression {
  return term.type === 'AccessExpression';
}

export function isList(term: Term): term is List {
  return term.type === 'List';
}

export function isTable(term: Term): term is Table {
  return term.type === 'Table';
}

export function isInvoke(term: Term): term is Invoke {
  return term.type === 'Invoke';
}

export function isWildcard(term: Term): term is WILDCARD {
  return term.type === 'Token' && term.name === 'WILDCARD';
}

export function isLiteral(term: Term): term is Literal {
  return term.type === 'Token' &&
    (term.name === 'NUMBER'
      || term.name === 'STRING'
      || term.name === 'SYMBOL');
}

export function isName(term: Term): term is NAME {
  return term.type === 'Token' && term.name === 'NAME';
}

export function isSymbol(term: Term): term is SYMBOL {
  return term.type === 'Token' && term.name === 'SYMBOL';
}

export function isNumber(term: Term): term is NUMBER {
  return term.type === 'Token' && term.name === 'NUMBER';
}

export function isString(term: Term): term is STRING {
  return term.type === 'Token' && term.name === 'STRING';
}

export type CodeLocation =
  {
    start: { offset: number, line: number, column: number };
    end: { offset: number, line: number, column: number };
  }

export type LocatedCode =
  {
    _location: CodeLocation;
  }

export type Program =
  {
    type: 'Program',
    program: Invoke[]
  }

export type Term
  = List
  | Table
  | Invoke
  | Literal
  | AccessExpression
  | NAME
  | WILDCARD
  ;

export type Invoke =
  {
    type: 'Invoke';
    target: AccessExpression | NAME | SYMBOL | WILDCARD;
    args: Term[];
  } & LocatedCode

export type AccessExpression =
  {
    type: 'AccessExpression';
    root: NAME;
    segments: AccessSegment[];
  } & LocatedCode

export type AccessSegment =
  {
    type: 'AccessSegment';
    name: NAME;
    mode: '::?' | ':?' | '::' | ':';
  } & LocatedCode

export type List =
  {
    type: 'List';
    values: Term[];
  } & LocatedCode

export type Table =
  {
    type: 'Table';
    values: Term[];
    escaped: boolean;
  } & LocatedCode

export type Literal
  = NUMBER
  | STRING
  | SYMBOL
  ;

// Token rules
export type LPAREN =
  { type: 'Token', value: string, name: 'LPAREN' } & LocatedCode

export type RPAREN =
  { type: 'Token', value: string, name: 'RPAREN' } & LocatedCode

export type NAME =
  { type: 'Token', value: string, name: 'NAME' } & LocatedCode

export type NUMBER =
  { type: 'Token', value: string, name: 'NUMBER' } & LocatedCode

export type STRING =
  { type: 'Token', value: string, name: 'STRING' } & LocatedCode

export type SYMBOL =
  { type: 'Token', value: string, name: 'SYMBOL' } & LocatedCode

export type LSQUARE_BRACE =
  { type: 'Token', value: string, name: 'LSQUARE_BRACE' } & LocatedCode

export type RSQUARE_BRACE =
  { type: 'Token', value: string, name: 'RSQUARE_BRACE' } & LocatedCode

export type LBRACE =
  { type: 'Token', value: string, name: 'LBRACE' } & LocatedCode

export type RBRACE =
  { type: 'Token', value: string, name: 'RBRACE' } & LocatedCode

export type WILDCARD =
  { type: 'Token', value: string, name: 'WILDCARD' } & LocatedCode

export type _ =
  { type: 'Token', value: string, name: '_' } & LocatedCode
