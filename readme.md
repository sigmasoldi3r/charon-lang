# Charon Programming Language

Charon is a simple dynamic typed, functional programming language.

The aim of charon is to provide a LISP like syntax, and a functional way
of defining programs. Charon enforces the programmer to distinguish between
the pure functions and the impure ones.

```clj
; Hello world
(println "Hello World!")
```

### Function purity

Charon functions must be pure by default. That is true if they follow a simple
rule: Do not invoke impure functions. That's it.

Script scope is impure, however main is pure. That's because you want your
script to define functions, which is an impure action (They mutate the global
state).

The advantage of pure functions is that they can be memoized and even constant
expressions (compile time inlined). Plus test-friendly, as they are idempotent.

Examples:
```clj
; This is pure
(def sum [a b]
  (+ a b))

; This is impure
(def-impure shout []
  (println "Hello!"))

; This is legal
(def-impure something []
  (println "2 + 2 =" (sum 2 2)))

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

### Example

Syntax is inspired by _Clojurescript_, but lacks macros and adds the
`def-impure` statement.

```clojure
; Example of import:
(import "samples/lib" lib)

(println "Hello world!")
(println "oh-man ->" (get "oh-man" lib))
(println "(sum 2 2) ->" (call (get "sum" lib) 2 2))

; That's it folks!
; Impure functions tho:

(let [state (atom 0)]
  (def-impure print-state []
    (println "State: " (atom/get state)))
  (def-impure count []
    (atom/set! state
      (+ (atom/get state) 1))))

; An impure main!
(def-impure impure-main []
  (let [file (file/open "test.txt" "r")]
    (if (some? file)
      (do
        (file/write file "Hello there!")
        (file/close file))
      (println "Could not open the file!")))
  (print-state)
  (count)
  (print-state)
  (count)
  (print-state))

(def-value tester true)
(if tester
  (+ 2 2)
  (println "nooo")
  (- 1 1))

(if (= tester true)
  (println "Simple dimple"))

; Comparison operators
(def-value simple-eq (= 1 2))
(def-value complex-eq (= 1 2 3 4))
(def-value complex-lt (> 1 2 3 4))
(def-value complex-gt (< 1 2 3 4))
(def-value complex-gteq (>= 1 2 3 4))

; Logic operators
(def-value all-or (or true false false true))
(def-value all-and (and true false false true))
; "not" has 1-arity, so the excess of arguments produces error.
(def-value simple-not (not true))
; Other stuff
(def-value more-things
  { "nor" (nor true false true)
    "nand" (nand true false true)
    "xor" (xor true false)
    "xor-nary" (xor true false true false true false) ; Xor is n-ary in fact.
  })
(println "nor =" (get "nor" more-things))
(println "nand =" (get "nand" more-things))
(println "xor =" (get "xor" more-things))
(println "xor-nary =" (get "xor-nary" more-things))

(def double [x]
  (* x 2))

; Vectors
(def-value doubles
  (vector/map [1 2 3 4] double))

(if tester
  (+ 2 3)
  (* 5 5))

; Do blocks!
(if tester
  (do
    (println "Thing one")
    (println "Thing two..."))
  (println "This is part of the 'else'"))

(def something [] unit)

; Somewhat threading macros
(println "Result:"
  (-> 2
    (+ 4)
    (* 8)))

(<- 2
  (+ 4)
  (* 8)
  (println "Result:"))

; Try catch!
(try (something)
  (catch [err]
    (println "Error! " err)))

; For sake of optimization, instead of reducing functions, arithmetics are
; expanded to their binary operator counterparts.
(println "Arithmetic expansion! "
  (+ (- 2 5 6) 1 2 3 4 5 (* 1 2 6 8)))

; Main must be pure!
; Opaque call allows calling impure functions from pure context.
(def main []
  (opaque-call impure-main))
```
