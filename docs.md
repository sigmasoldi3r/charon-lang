# Charon API

A list of objects, functions and operators.

**WARNING**: Under construction!

## Library functions

 - `def`
 - `def-impure`
 - `let`
 - `apply`
 - `if`
 - `try`
 - `catch`
 - `do`
 - `for`
 - `fn`
 - `...`
 - `+`
 - `-`
 - `/`
 - `*`
 - `^`
 - `=`
 - `<>`
 - `>`
 - `<`
 - `>=`
 - `<=`
 - `and`
 - `or`
 - `not`
 - `nand`
 - `nor`
 - `xor`
 - `->` Threads each result of the call to the rightmost argument of the next
 function.
```clj
; Example of usage for (->)
(-> 5
  (+ 1)
  (- 2))
; Translates to
(- 2 (+ 1 5))
```
 - `<-` Like the thread-right macro, but passes to the leftmost argument.
 - `->>` The multiple application macro passes the first element as rightmost
 element of all function calls and stores each result in a vector.
```clj
; Example
(->> 1 (+ 2) (- 2))
; Translates to
[(+ 2 1) (- 2 1)]
```
 - `<<-` Like the multiple application macro (right version), but passes the
 element to the leftmost place.
 - `str` Creates a new string concatenating all elements stringified.
```clj
; Example
(assert
  (str "Hello " "world!")
  "Hello world!")
```
 - `range` Generates a paired iterable object.
 - `import`
 - `def-value`
 - `def-extern`
 - `when`
 - `unit`
 - `true`
 - `false`
 - `some?`
 - `or?`
 - `>>=`
 - `atom`
 - `opaque-call`
 - `call`
 - `println`
 - `print`
 - `file/open`
 - `file/close`
 - `file/write`
 - `file/read`

## Library objects and collections

### string

Methods related:

 - `string/byte`
 - `string/char`
 - `string/dump`
 - `string/find`
 - `string/format`
 - `string/gmatch`
 - `string/gsub`
 - `string/len`
 - `string/lower`
 - `string/match`
 - `string/rep`
 - `string/reverse`
 - `string/sub`
 - `string/upper`

### vector

A vector is a collection of incrementing integer keys, like lists or arrays in
other languages.

```clj
; Example of creation
(def-value v [1 2 3 4])
```

Methods related:

 - `vector/map`
 - `vector/each`
 - `vector/get`
 - `vector/filter`
 - `vector/merge`
 - `vector/add`
 - `vector/drop`
 - `vector/drop-left`
 - `vector/len`
 - `vector/reduce`

### table

A table is a collection of arbitrarily keyed objects. This means that a table's
key can be anything, even `unit`!

To create a new table use the literal `{}`.

```clj
; Example
(def-value my-table
  { :hello "World"
    :use "symbols for keys, usually."
    55 "But you can really use anything"
  })
```

Methods related:

 - `table/get`
 - `table/get?`
 - `table/remove`
 - `table/merge`

### atom

Atoms are special objects dedicated to the state mutation. Atoms hold an
internal state that can be read with `atom/get` and mutated with `atom/reset!`
or `atom/apply!`.

Therefore all read/write operations to an atom are impure.

```clj
(let [count (atom 0)]
  (atom/reset! count 1)
  (atom/apply! count + 1)
  (println "count = " (atom/get count)))
```

Methods related:

 - `atom/get`
 - `atom/reset!`
 - `atom/apply!`

### record

**Planned feature.**

Represents an arbitrary data tree with associated methods, but
in distinction of an object it can ensure purity.

### object

An object is anything that is not a primitive, or a standard collection. The
underlying implementation is a any Lua table, and is the primary method for
interacting with existing Lua codebase.

```clj
; Creates a new Lua table, keys are not symbols but strings (Plain old Lua).
(def-value my_second_object
  (object/new
    { :some_field "Hey"
      :some_other 539
    }))
```

Related methods:

 - `object/new`
 - `object/new-raw`
 - `object/get`
 - `object/set`

### unit

Unit is a singleton object which contains no data. Acts like `null` in other
languages, but it's a single object that can be referenced.

This means that there is a distinction between no-value (unit) and non-existent
reference or variable, which has no type in Charon but would translate to `nil`
in Lua.

All that has no value will return unit in charon (including void methods). Unit
can be used as a key for indexing a table, which is different from not having
the entry at all.
