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
  'defn':
    _({
      name: '#defn'
      , kind: DataKind.MACRO_FUNC
    }),
  'defn!':
    _({
      name: '#defn!'
      , kind: DataKind.MACRO_FUNC
    }),
  'def':
    _({
      name: '#def'
      , kind: DataKind.MACRO_FUNC
    }),
  'defn-':
    _({
      name: '#def-private'
      , kind: DataKind.MACRO_FUNC
    }),
  'defn!-':
    _({
      name: '#defn!-private'
      , kind: DataKind.MACRO_FUNC
    }),
  'def-':
    _({
      name: '#def-value-private'
      , kind: DataKind.MACRO_FUNC
    }),
  'declare':
    _({
      name: '#declare'
      , kind: DataKind.MACRO_FUNC
    }),
  'let':
    _({
      name: '#let'
      , kind: DataKind.MACRO_FUNC
    }),
  '__self_ref__':
    _({
      name: '__self_ref__'
      , kind: DataKind.LOCAL
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
  '->>':
    _({
      name: '#thread-parallel'
      , kind: DataKind.MACRO_FUNC
      // , fallbackRef: 'charon.thread_parallel'
    }),
  '<<-':
    _({
      name: '#thread-parallel-last'
      , kind: DataKind.MACRO_FUNC
      // , fallbackRef: 'charon.thread_parallel_last'
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
  'module':
    _({
      name: '#module'
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
  'type':
    _({
      name: 'charon.type'
      , kind: DataKind.FUNC
    }),
  'is?':
    _({
      name: 'charon.is'
      , kind: DataKind.FUNC
    }),
  'in?':
    _({
      name: 'charon.in_args'
      , kind: DataKind.FUNC
    }),
  'string?':
    _({
      name: 'charon.is_string'
      , kind: DataKind.FUNC
    }),
  'number?':
    _({
      name: 'charon.is_number'
      , kind: DataKind.FUNC
    }),
  'boolean?':
    _({
      name: 'charon.is_boolean'
      , kind: DataKind.FUNC
    }),
  'list?':
    _({
      name: 'charon.is_list'
      , kind: DataKind.FUNC
    }),
  'table?':
    _({
      name: 'charon.is_table'
      , kind: DataKind.FUNC
    }),
  'symbol?':
    _({
      name: 'charon.is_symbol'
      , kind: DataKind.FUNC
    }),
  'atom?':
    _({
      name: 'charon.is_atom'
      , kind: DataKind.FUNC
    }),
  'object?':
    _({
      name: 'charon.is_object'
      , kind: DataKind.FUNC
    }),
  'unit?':
    _({
      name: 'charon.is_unit'
      , kind: DataKind.FUNC
    }),
  'nothing?':
    _({
      name: 'charon.is_nothing'
      , kind: DataKind.FUNC
    }),
  'not-unit?':
    _({
      name: 'charon.isnt_unit'
      , kind: DataKind.FUNC
    }),
  'not-nothing?':
    _({
      name: 'charon.isnt_nothing'
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
  // CRD and serialization
  'crd/decode':
    _({
      name: 'charon.crd_decode'
      , kind: DataKind.FUNC
    }),
  // List
  'list/map':
    _({
      name: 'charon.list_map'
      , kind: DataKind.FUNC
    }),
  'list/each':
    _({
      name: 'charon.list_each'
      , kind: DataKind.FUNC
    }),
  'list/get':
    _({
      name: 'charon.list_get'
      , kind: DataKind.FUNC
    }),
  'list/filter':
    _({
      name: 'charon.list_filter'
      , kind: DataKind.FUNC
    }),
  'list/merge':
    _({
      name: 'charon.list_merge'
      , kind: DataKind.FUNC
    }),
  'list/append':
    _({
      name: 'charon.list_append'
      , kind: DataKind.FUNC
    }),
  'list/prepend':
    _({
      name: 'charon.list_prepend'
      , kind: DataKind.FUNC
    }),
  'list/drop':
    _({
      name: 'charon.list_drop'
      , kind: DataKind.FUNC
    }),
  'list/drop-left':
    _({
      name: 'charon.list_drop_left'
      , kind: DataKind.FUNC
    }),
  'list/len':
    _({
      name: 'charon.list_len'
      , kind: DataKind.FUNC
    }),
  'list/has?':
    _({
      name: 'charon.list_has'
      , kind: DataKind.FUNC
    }),
  'list/find':
    _({
      name: 'charon.list_find'
      , kind: DataKind.FUNC
    }),
  'list/reduce':
    _({
      name: 'charon.list_reduce'
      , kind: DataKind.FUNC
    }),
  'list/reduce-indexed':
    _({
      name: 'charon.list_reduce_indexed'
      , kind: DataKind.FUNC
    }),
  // Table
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
  'assert':
    _({
      name: 'assert'
      , kind: DataKind.FUNC
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
      name: 'charon.string_find'
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
      name: 'charon.string_match'
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
  // Math bindings
  'math/abs':
    _({
      name: 'math.abs'
      , kind: DataKind.FUNC
    }),
  'math/acos':
    _({
      name: 'math.acos'
      , kind: DataKind.FUNC
    }),
  'math/asin':
    _({
      name: 'math.asin'
      , kind: DataKind.FUNC
    }),
  'math/atan':
    _({
      name: 'math.atan'
      , kind: DataKind.FUNC
    }),
  'math/atan2':
    _({
      name: 'math.atan2'
      , kind: DataKind.FUNC
    }),
  'math/ceil':
    _({
      name: 'math.ceil'
      , kind: DataKind.FUNC
    }),
  'math/cos':
    _({
      name: 'math.cos'
      , kind: DataKind.FUNC
    }),
  'math/cosh':
    _({
      name: 'math.cosh'
      , kind: DataKind.FUNC
    }),
  'math/deg':
    _({
      name: 'math.deg'
      , kind: DataKind.FUNC
    }),
  'math/exp':
    _({
      name: 'math.exp'
      , kind: DataKind.FUNC
    }),
  'math/floor':
    _({
      name: 'math.floor'
      , kind: DataKind.FUNC
    }),
  'math/fmod':
    _({
      name: 'math.fmod'
      , kind: DataKind.FUNC
    }),
  'math/frexp':
    _({
      name: 'math.frexp'
      , kind: DataKind.FUNC
    }),
  'math/ldexp':
    _({
      name: 'math.ldexp'
      , kind: DataKind.FUNC
    }),
  'math/log':
    _({
      name: 'math.log'
      , kind: DataKind.FUNC
    }),
  'math/log10':
    _({
      name: 'math.log10'
      , kind: DataKind.FUNC
    }),
  'math/max':
    _({
      name: 'math.max'
      , kind: DataKind.FUNC
    }),
  'math/min':
    _({
      name: 'math.min'
      , kind: DataKind.FUNC
    }),
  'math/modf':
    _({
      name: 'math.modf'
      , kind: DataKind.FUNC
    }),
  'math/pow':
    _({
      name: 'math.pow'
      , kind: DataKind.FUNC
    }),
  'math/rad':
    _({
      name: 'math.rad'
      , kind: DataKind.FUNC
    }),
  'math/random':
    _({
      name: 'math.random'
      , kind: DataKind.FUNC
    }),
  'math/randomseed':
    _({
      name: 'math.randomseed'
      , kind: DataKind.FUNC
    }),
  'math/sin':
    _({
      name: 'math.sin'
      , kind: DataKind.FUNC
    }),
  'math/sinh':
    _({
      name: 'math.sinh'
      , kind: DataKind.FUNC
    }),
  'math/sqrt':
    _({
      name: 'math.sqrt'
      , kind: DataKind.FUNC
    }),
  'math/tan':
    _({
      name: 'math.tan'
      , kind: DataKind.FUNC
    }),
  'math/tanh':
    _({
      name: 'math.tanh'
      , kind: DataKind.FUNC
    }),
} as const;
