/*
 *
 */

export function isName(term: Term): term is NAME {
  return term.type === 'Token' && term.name === 'NAME';
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
  ;

export type Invoke =
  {
    type: 'Invoke',
    name: NAME,
    args: Term[]
  }

export type Vector =
  {
    type: 'Vector',
    list: Term[]
  }

export type Table =
  {
    type: 'Table',
    list: Term[]
  }

export type Literal
  = NUMBER
  | STRING
  ;

// Token rules
export type LPAREN =
  { type: 'Token', value: string, name: 'LPAREN' }

export type RPAREN =
  { type: 'Token', value: string, name: 'RPAREN' }

export type NAME =
  { type: 'Token', value: string, name: 'NAME' }

export type NUMBER =
  { type: 'Token', value: string, name: 'NUMBER' }

export type STRING =
  { type: 'Token', value: string, name: 'D_STRING' }

export type LSQUARE_BRACE =
  { type: 'Token', value: string, name: 'LSQUARE_BRACE' }

export type RSQUARE_BRACE =
  { type: 'Token', value: string, name: 'RSQUARE_BRACE' }

export type LBRACE =
  { type: 'Token', value: string, name: 'LBRACE' }

export type RBRACE =
  { type: 'Token', value: string, name: 'RBRACE' }

export type _ =
  { type: 'Token', value: string, name: '_' }
