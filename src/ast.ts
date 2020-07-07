/*
 *
 */

export function isName(term: Term): term is NAME {
  return term.type === 'Token' && term.name === 'NAME';
}

export function isSymbol(term: Term): term is SYMBOL {
  return term.type === 'Token' && term.name === 'SYMBOL';
}

export function isAccessExpression(term: Term): term is AccessExpression {
  return term.type === 'AccessExpression';
}

export function isVector(term: Term): term is Vector {
  return term.type === 'Vector';
}

export function isTable(term: Term): term is Table {
  return term.type === 'Table';
}

export function isInvoke(term: Term): term is Invoke {
  return term.type === 'Invoke';
}

export type CodeLocation =
  {
    start: { offset: number, line: number, column: number };
    end:   { offset: number, line: number, column: number };
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
  = Vector
  | Table
  | Invoke
  | Literal
  | NAME
  | AccessExpression
  ;

export type Invoke =
  {
    type: 'Invoke';
    target: AccessExpression | NAME | SYMBOL;
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

export type Vector =
  {
    type: 'Vector';
    list: Term[];
  } & LocatedCode

export type Table =
  {
    type: 'Table';
    list: Term[];
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

export type _ =
  { type: 'Token', value: string, name: '_' } & LocatedCode
