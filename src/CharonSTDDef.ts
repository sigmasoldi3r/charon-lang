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
  'throw':
    _({
      name: 'error'
      , kind: DataKind.FUNC
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
  'for':
    _({
      name: '#for'
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
      , fallbackRef: 'charon.plus'
    }),
  '-':
    _({
      name: '#minus'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.minus'
    }),
  '/':
    _({
      name: '#div'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.div'
    }),
  '*':
    _({
      name: '#mul'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.mul'
    }),
  '^':
    _({
      name: '#pow'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.pow'
    }),
  '=':
    _({
      name: '#eq'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.eq'
    }),
  '<>':
    _({
      name: '#neq'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.neq'
    }),
  '>':
    _({
      name: '#gt'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.gt'
    }),
  '<':
    _({
      name: '#lt'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.lt'
    }),
  '>=':
    _({
      name: '#gteq'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.gteq'
    }),
  '<=':
    _({
      name: '#lteq'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.lteq'
    }),
  'and':
    _({
      name: '#and'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon._and'
    }),
  'or':
    _({
      name: '#or'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon._or'
    }),
  'not':
    _({
      name: '#not'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon._not'
    }),
  'nand':
    _({
      name: '#nand'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.nand'
    }),
  'nor':
    _({
      name: '#nor'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.nor'
    }),
  'xor':
    _({
      name: '#xor'
      , kind: DataKind.MACRO_FUNC
      , fallbackRef: 'charon.xor'
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
      name: 'charon.str'
      , kind: DataKind.FUNC
    }),
  'range':
    _({
      name: 'charon.range'
      , kind: DataKind.FUNC
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
  'when':
    _({
      name: '#when'
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
  'or?':
    _({
      name: 'charon.or_coalesce'
      , kind: DataKind.FUNC
    }),
  '>>=':
    _({
      name: 'charon.compose'
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
  'vector/merge':
    _({
      name: 'charon.vector_merge'
      , kind: DataKind.FUNC
    }),
  'vector/add':
    _({
      name: 'charon.vector_add'
      , kind: DataKind.FUNC
    }),
  'vector/drop':
    _({
      name: 'charon.vector_drop'
      , kind: DataKind.FUNC
    }),
  'vector/drop-left':
    _({
      name: 'charon.vector_drop_left'
      , kind: DataKind.FUNC
    }),
  'vector/len':
    _({
      name: 'charon.vector_len'
      , kind: DataKind.FUNC
    }),
  'table/get':
    _({
      name: 'charon.table_get'
      , kind: DataKind.FUNC
    }),
  'table/get?':
    _({
      name: 'charon.table_get_or'
      , kind: DataKind.FUNC
    }),
  'table/remove':
    _({
      name: 'charon.table_remove'
      , kind: DataKind.FUNC
    }),
  'table/merge':
    _({
      name: 'charon.table_merge'
      , kind: DataKind.FUNC
    }),
  'object/new':
    _({
      name: 'charon.object_new'
      , kind: DataKind.FUNC
    }),
  'object/new-raw':
    _({
      name: 'charon.object_new_raw'
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
  'atom/reset!':
    _({
      name: 'charon.atom_set'
      , kind: DataKind.IMPURE_FUNC
    }),
  'atom/apply!':
    _({
      name: 'charon.atom_apply'
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
  'println!':
    _({
      name: 'charon.println'
      , kind: DataKind.IMPURE_FUNC
    }),
  'print!':
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
