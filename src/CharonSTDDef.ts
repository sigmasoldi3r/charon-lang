/**
 * Charon platform standard bindings and definitions (Such as macros and
 * function references).
 */
import { dataPlace as _, DataKind } from './CompilerExtras';

export const stdlib = {
  'def':
    _({
      name: '#def'
      , kind: DataKind.MACRO_FUNC
    }),
  'def-impure':
    _({
      name: '#def-impure'
      , kind: DataKind.MACRO_FUNC
    }),
  'let':
    _({
      name: '#let'
      , kind: DataKind.MACRO_FUNC
    }),
  'apply':
    _({
      name: '#apply'
      , kind: DataKind.MACRO_FUNC
    }),
  'if':
    _({
      name: '#if'
      , kind: DataKind.MACRO_FUNC
    }),
  'try':
    _({
      name: '#try'
      , kind: DataKind.MACRO_FUNC
    }),
  'catch':
    _({
      name: '#catch'
      , kind: DataKind.MACRO_FUNC
    }),
  'do':
    _({
      name: '#do'
      , kind: DataKind.MACRO_FUNC
    }),
  'fn':
    _({
      name: '#fn'
      , kind: DataKind.MACRO_FUNC
    }),
  '...':
    _({
      name: '#three-dots'
      , kind: DataKind.MACRO_FUNC
    }),
  '+':
    _({
      name: '#plus'
      , kind: DataKind.MACRO_FUNC
    }),
  '-':
    _({
      name: '#minus'
      , kind: DataKind.MACRO_FUNC
    }),
  '/':
    _({
      name: '#div'
      , kind: DataKind.MACRO_FUNC
    }),
  '*':
    _({
      name: '#mul'
      , kind: DataKind.MACRO_FUNC
    }),
  '^':
    _({
      name: '#pow'
      , kind: DataKind.MACRO_FUNC
    }),
  '=':
    _({
      name: '#eq'
      , kind: DataKind.MACRO_FUNC
    }),
  '<>':
    _({
      name: '#neq'
      , kind: DataKind.MACRO_FUNC
    }),
  '>':
    _({
      name: '#gt'
      , kind: DataKind.MACRO_FUNC
    }),
  '<':
    _({
      name: '#lt'
      , kind: DataKind.MACRO_FUNC
    }),
  '>=':
    _({
      name: '#gteq'
      , kind: DataKind.MACRO_FUNC
    }),
  '<=':
    _({
      name: '#lteq'
      , kind: DataKind.MACRO_FUNC
    }),
  'and':
    _({
      name: '#and'
      , kind: DataKind.MACRO_FUNC
    }),
  'or':
    _({
      name: '#or'
      , kind: DataKind.MACRO_FUNC
    }),
  'not':
    _({
      name: '#not'
      , kind: DataKind.MACRO_FUNC
    }),
  'nand':
    _({
      name: '#nand'
      , kind: DataKind.MACRO_FUNC
    }),
  'nor':
    _({
      name: '#nor'
      , kind: DataKind.MACRO_FUNC
    }),
  'xor':
    _({
      name: '#xor'
      , kind: DataKind.MACRO_FUNC
    }),
  '->':
    _({
      name: '#thread-first'
      , kind: DataKind.MACRO_FUNC
    }),
  '<-':
    _({
      name: '#thread-last'
      , kind: DataKind.MACRO_FUNC
    }),
  'str':
    _({
      name: '#string'
      , kind: DataKind.MACRO_FUNC
    }),
  'import':
    _({
      name: '#import'
      , kind: DataKind.MACRO_FUNC
    }),
  'def-value':
    _({
      name: '#def-value'
      , kind: DataKind.MACRO_FUNC
    }),
  'def-extern':
    _({
      name: '#def-extern'
      , kind: DataKind.MACRO_FUNC
    }),
  'unit':
    _({
      name: 'charon.Unit'
      , kind: DataKind.LOCAL
    }),
  'true':
    _({
      name: 'charon.True'
      , kind: DataKind.LOCAL
    }),
  'false':
    _({
      name: 'charon.False'
      , kind: DataKind.LOCAL
    }),
  'some?':
    _({
      name: 'charon.some'
      , kind: DataKind.FUNC
    }),
  'vector/map':
    _({
      name: 'charon.vector_map'
      , kind: DataKind.FUNC
    }),
  'vector/each':
    _({
      name: 'charon.vector_each'
      , kind: DataKind.FUNC
    }),
  'vector/get':
    _({
      name: 'charon.vector_get'
      , kind: DataKind.FUNC
    }),
  'vector/filter':
    _({
      name: 'charon.vector_filter'
      , kind: DataKind.FUNC
    }),
  'vector/join':
    _({
      name: 'charon.vector_join'
      , kind: DataKind.FUNC
    }),
  'table/get':
    _({
      name: 'charon.table_get'
      , kind: DataKind.FUNC
    }),
  'table/remove':
    _({
      name: 'charon.table_remove'
      , kind: DataKind.FUNC
    }),
  'table/join':
    _({
      name: 'charon.table_join'
      , kind: DataKind.FUNC
    }),
  'object/get':
    _({
      name: 'charon.object_get'
      , kind: DataKind.IMPURE_FUNC
    }),
  'object/set':
    _({
      name: 'charon.object_set'
      , kind: DataKind.IMPURE_FUNC
    }),
  'atom':
    _({
      name: 'charon.atom'
    }),
  'atom/set!':
    _({
      name: 'charon.atom_set'
      , kind: DataKind.IMPURE_FUNC
    }),
  'atom/get':
    _({
      name: 'charon.atom_get'
      , kind: DataKind.IMPURE_FUNC
    }),
  'opaque-call':
    _({
      name: 'charon.opaque_call'
    }),
  'call':
    _({
      name: 'charon.call'
    }),
  'println':
    _({
      name: 'charon.println'
      , kind: DataKind.IMPURE_FUNC
    }),
  'print':
    _({
      name: 'charon.print'
      , kind: DataKind.IMPURE_FUNC
    }),
  'file/open':
    _({
      name: 'charon.file_open'
      , kind: DataKind.IMPURE_FUNC
    }),
  'file/close':
    _({
      name: 'charon.file_close'
      , kind: DataKind.IMPURE_FUNC
    }),
  'file/write':
    _({
      name: 'charon.file_write'
      , kind: DataKind.IMPURE_FUNC
    }),
  'file/read':
    _({
      name: 'charon.file_read'
      , kind: DataKind.IMPURE_FUNC
    }),
  // Well known Lua platform pure functions.
  'string/byte':
    _({
      name: 'string.byte'
      , kind: DataKind.FUNC
    }),
  'string/char':
    _({
      name: 'string.char'
      , kind: DataKind.FUNC
    }),
  'string/dump':
    _({
      name: 'string.dump'
      , kind: DataKind.FUNC
    }),
  'string/find':
    _({
      name: 'string.find'
      , kind: DataKind.FUNC
    }),
  'string/format':
    _({
      name: 'string.format'
      , kind: DataKind.FUNC
    }),
  'string/gmatch':
    _({
      name: 'string.gmatch'
      , kind: DataKind.FUNC
    }),
  'string/gsub':
    _({
      name: 'string.gsub'
      , kind: DataKind.FUNC
    }),
  'string/len':
    _({
      name: 'string.len'
      , kind: DataKind.FUNC
    }),
  'string/lower':
    _({
      name: 'string.lower'
      , kind: DataKind.FUNC
    }),
  'string/match':
    _({
      name: 'string.match'
      , kind: DataKind.FUNC
    }),
  'string/rep':
    _({
      name: 'string.rep'
      , kind: DataKind.FUNC
    }),
  'string/reverse':
    _({
      name: 'string.reverse'
      , kind: DataKind.FUNC
    }),
  'string/sub':
    _({
      name: 'string.sub'
      , kind: DataKind.FUNC
    }),
  'string/upper':
    _({
      name: 'string.upper'
      , kind: DataKind.FUNC
    }),
} as const;
