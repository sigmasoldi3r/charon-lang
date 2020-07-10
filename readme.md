![charon logo](app.png)

# Charon Programming Language
![license badge](https://img.shields.io/github/license/sigmasoldi3r/charon-lang?style=flat-square)
![issues-badge](https://img.shields.io/github/issues/sigmasoldi3r/charon-lang?style=flat-square)
![release-badges](https://img.shields.io/github/v/release/sigmasoldi3r/charon-lang?include_prereleases&style=flat-square)

Charon is a simple dynamic typed, functional programming language.

The aim of charon is to provide a LISP like syntax, and a functional way
of defining programs. Charon enforces the programmer to distinguish between
the pure functions and the impure ones.

```clj
; Hello world
(println! "Hello World!")
```

## Binaries

At the moment only windows is built, in the future binary distributions for
other OSes will be added.

Beware that the compiler and language spec is in alpha stage.

Go to releases https://github.com/sigmasoldi3r/charon-lang/releases to grab
the latest.

## Usage notes

If you want the runtime to be shared (Smaller script sizes!), you can extract it
locally by running `charon --extract-runtime`.

Otherwise you can just compile normally and provide `--embed-runtime` for every
file.

### Function purity

Charon functions must be pure by default. That is true if they follow a simple
rule: Do not invoke impure functions. That's it.

Note that any I/O is considered impure.

The advantage\* of pure functions is that they can be memoized and even constant
expressions (compile time inlined). Plus test-friendly, as they are idempotent.

\*Note: Not currently implemented.

**Disclaimer:** As Charon is a language designed to target and interface with
Lua, the purity check is somewhat loose, and can be tricked. For example calling
by reference a function who's symbol is not a function but a local might lead to
unchecked execution of mixed contexts. For that reason anything that might be
unchecked is considered impure. This is also a pending work for Charon, to
include purity checks for locals and referential calls.

Also this means that object manipulation (either read or write) is always
impure, and for that same reason you can't mutate tables or vectors.

Examples:
```clj
; This is pure
(def sum [a b]
  (+ a b))

; This is impure
(def-impure shout []
  (println! "Hello!"))

; This is legal
(def-impure something []
  (println! "2 + 2 =" (sum 2 2)))

; This is illegal
(def some-other []
  (shout))
```

Pure functions can be called from impure context, but not the other way round.

### Dealing with the state

Charon does not have any operator for mutating state. Instead, provides the term
of an atom, which in turn contains read and write operations which are impure.

Atoms are implemented outside of the language, as charon does not have any way
of "assigning" a variable as other languages do.

## Standard library

Charon standard library is small, it relies on Lua standard library for most
things.

**WARNING**: All standard library functions should be tested (Not tested yet).

Note: All functions, methods and operators are being documented at
[docs.md](docs.md), but still being written. This document is a simple
introduction to the language and it's features.

### Vector

A vector is a collection of values. Vector is immutable, but you can join and
append to create new ones.

To create a new vector use the literal `[]`.

- `vector/merge` merges two vectors into a new one.
- `vector/add` appends elements to the vector.
- `vector/get` returns the nth element or `unit`.
- `vector/len` returns the length of the vector.
- `vector/drop` returns a new vector dropping n elements from the right.
- `vector/drop-left` returns a new vector dropping n elements from the left.
- `vector/drop-left` returns a new vector dropping n elements from the left.
- `vector/map` returns a new vector with the result of the mapping function for each element.
- `vector/filter` returns a new vector filtered using the result of the filter function.
- `vector/each` calls the function for each element, presumably for side effects. Returns `unit`.

```clj
; Example
(def-value my-vector [1 2 3 4])
```

### Table

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

### Object

An object is anything that is not a primitive, or a standard collection. The
underlying implementation is a any Lua table, and is the primary method for
interacting with existing Lua codebase.

Example:
```lua
-- Suppose you have existing old code
local my_object = {
  name = "Object"
};
function my_object:something()
  print("I am " .. self.name);
end
function my_object.static()
  print("I am another method");
end
```

To interface it with Lua, you can import the object (Or declare extern if
global):
```clj
(import [ my_object ] :from "my_script.lua")

(println!
  (object/get my_object "name"))

(object/set my_object "new_field"
  (fn [self]
    (println! "I am a method!")))

; There's also a shorthand for calling methods
(my_object:something)
(my_object::static)

; Creates a new Lua table, keys are not symbols but strings (Plain old Lua).
(def-value my_second_object
  (object/new
    { :some_field "Hey"
      :some_other 539
    }))
```

At the moment, there are three object interaction methods:

- `object/new` the only pure function, creates a new object from a table.
  Deep translates symbols like `:some_key` to string. If for some reason you
  want to build an object untouched use `object/new-raw`.
- `object/new-raw` same as `object/new` but leaves keys as is.
- `object/set` sets the field to a value, thus impure.
- `object/get` gets the field, and as objects are mutable this is also impure.

### Example

Remember that functions are documented in [docs.md](docs.md) file.

Syntax is inspired by _Clojurescript_.
You can't define your own macros at the moment, but there are several included
with the compiler, like:

- `def` Which defines a package level **function**.
- `def-impure` Which defines a package level **impure function**.
- `def-value` Which defines a package level **constant**.
- `let` Binding, which works like clojure's let.
- `if` Block, the first expression is for true branch, the rest for false.
- `do` Block which simply runs the expression list and returns the last.
- `<-` Thread last and `->` thread first macros. This macro chains the
call expression list one inside another:
```clj
(-> 5 (a 1) (b 2)) ; becomes
(b (a 5 1) 2)
(<- 5 (a 1) (b 2)) ; becomes
(b 2 (a 1 5))
```
- Compose function `>>=` acts like threading macros but in fact is a function
that actually composes functions (Therefore return new functions). This is
considered **pure** despite that the produced function is impure.
```clj
(def my-fn [a] (+ a 1))
(def other [a] (* a 2))
(def-value third
  (>>= my-fn other))
; Equivalent:
(def like-third [a]
  (* (+ a 1) 2))
```

Among others (To be documented).

See [samples/sample.crn](samples/sample.crn) for a full example of code, where
all features are thrown into a single script.

More notes: import does not read any symbol from the module (Nor does export
the module any). This means that purity checks between library calls are faked
at the moment. The plan is to add symbols to Charon modules, and detect when
those are not charon modules in order to make purity check stricter.
