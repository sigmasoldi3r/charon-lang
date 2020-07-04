# Charon Programming Language

Charon is a simple dynamic typed, functional programming language.

The aim of charon is to provide a LISP like syntax, and a functional way
of defining programs. Charon enforces the programmer to distinguish between
the pure functions and the impure ones.

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
; Simplest function I guess.
(def sum-two [a b]
  (+ a b))

(println "Hello world!")

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
  (print-state)
  (count)
  (print-state)
  (count)
  (print-state))

; For sake of optimization, instead of reducing functions, arithmetics are
; expanded to their binary operator counterparts.
(println "Arithmetic expansion! "
  (+ (- 2 5 6) 1 2 3 4 5 (* 1 2 6 8)))

; Main must be pure!
; Opaque call allows calling impure functions from pure context.
(def main []
  (opaque-call impure-main))
```
