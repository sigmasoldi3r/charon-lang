/*
 * Charon programming language.
 */

Program
  = _ program:(r:Invoke _ { return r })*
  {
    return { type: 'Program', program }
  }

Term
  = Vector
  / Table
  / Invoke
  / Literal
  / NAME
  

Invoke
  = LPAREN
  _ name:NAME
  _ args:(a:Term _ { return a })*
  RPAREN
  {
    return {
      type: 'Invoke',
      name,
      args
    }
  }

Vector
  = LSQUARE_BRACE _ list:(e:Term _ { return e })* RSQUARE_BRACE
  {
    return {
      type: 'Vector',
      list
    }
  }

Table
  = LBRACE _ list:(e:Term _ { return e })* RBRACE
  {
    return {
      type: 'Table',
      list
    }
  }

Literal
  = NUMBER
  / STRING

// Token rules
LPAREN
  = value:'('
  { return { type: 'Token', value, name: 'LPAREN' } }

RPAREN
  = value:')'
  { return { type: 'Token', value, name: 'RPAREN' } }

NAME
  = value:$([A-Za-z_?!@./$%~^*'+-][A-Za-z0-9_?!@./$%~^*'+-]*)
  { return { type: 'Token', value, name: 'NAME' } }

NUMBER
  = value:$([0-9]+ ('.' [0-9]+)?)
  { return { type: 'Token', value, name: 'NUMBER' } }

STRING
  = value:$('"' [^"]* '"')
  { return { type: 'Token', value, name: 'D_STRING' } }

LSQUARE_BRACE
  = value:'['
  { return { type: 'Token', value, name: 'LSQUARE_BRACE' } }

RSQUARE_BRACE
  = value:']'
  { return { type: 'Token', value, name: 'RSQUARE_BRACE' } }

LBRACE
  = value:'{'
  { return { type: 'Token', value, name: 'LBRACE' } }

RBRACE
  = value:'}'
  { return { type: 'Token', value, name: 'RBRACE' } }

COMMENT
  = ';' [^\r\n]* [\r\n]
_
  = value:$(COMMENT / [ \t\r\n]+)*
  { return { type: 'Token', value, name: '_' } }
