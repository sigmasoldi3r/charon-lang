/*
 * Charon programming language.
 */

Program
  = _ program:(r:Invoke _ { return r })* (';' [^\r\n]*)?
  {
    return { type: 'Program', program }
  }

Term
  = List
  / Table
  / Invoke
  / Literal
  / AccessExpression
  / NAME
  // / WILDCARD

Invoke
  = LPAREN
  _ target:(AccessExpression / NAME / SYMBOL) // / WILDCARD)
  _ args:(a:Term _ { return a })*
  RPAREN
  {
    return {
      _location: location(),
      type: 'Invoke',
      target,
      args
    }
  }

AccessExpression
  = root:NAME segments:AccessSegment+
  {
    return {
      _location: location(),
      type: 'AccessExpression',
      root,
      segments
    }
  }

AccessSegment
  = mode:('::?' / ':?' / '::' / ':') name:NAME
  {
    return {
      _location: location(),
      type: 'AccessSegment',
      mode,
      name
    }
  }

List
  = LSQUARE_BRACE _ values:(e:Term _ { return e })* RSQUARE_BRACE
  {
    return {
      _location: location(),
      type: 'List',
      values
    }
  }

Table
  = escaped:'\''? LBRACE _ values:(e:Term _ { return e })* RBRACE
  {
    return {
      _location: location(),
      type: 'Table',
      values,
      escaped: !!escaped
    }
  }

Literal
  = NUMBER
  / STRING
  / SYMBOL

// Token rules
LPAREN
  = value:'('
  { return { _location: location(), type: 'Token', value, name: 'LPAREN' } }

RPAREN
  = value:')'
  { return { _location: location(), type: 'Token', value, name: 'RPAREN' } }

NAME
  = value:$([A-Za-z_?!@.,`´¨ºª&¬/€$%~<>=|&^*'+-][A-Za-z0-9_?!@.,`´¨ºª&¬/€$%~<>=|&^*'+-]*)
  { return { _location: location(), type: 'Token', value, name: 'NAME' } }

NUMBER
  = value:$('-'? [0-9]+ ('.' [0-9]+)?)
  { return { _location: location(), type: 'Token', value, name: 'NUMBER' } }

STRING
  = value:$('"' ('\\"' / [^"])* '"')
  { return { _location: location(), type: 'Token', value, name: 'STRING' } }

SYMBOL
  = ':' value:$([A-Za-z0-9_?!@./$%~<>=|&^*'+-]+)
  { return { _location: location(), type: 'Token', value, name: 'SYMBOL' } }

LSQUARE_BRACE
  = value:'['
  { return { _location: location(), type: 'Token', value, name: 'LSQUARE_BRACE' } }

RSQUARE_BRACE
  = value:']'
  { return { _location: location(), type: 'Token', value, name: 'RSQUARE_BRACE' } }

LBRACE
  = value:'{'
  { return { _location: location(), type: 'Token', value, name: 'LBRACE' } }

RBRACE
  = value:'}'
  { return { _location: location(), type: 'Token', value, name: 'RBRACE' } }

// WILDCARD
//   = value:$('#' [0-9#']*)
//   { return { _location: location(), type: 'Token', value, name: 'WILDCARD' }}

COMMENT
  = ';' [^\r\n]* [\r\n]
_
  = value:$(COMMENT / [ \t\r\n]+)*
  { return { _location: location(), type: 'Token', value, name: '_' } }
