# Charon Programming Language

Charon is a simple dynamic typed, functional programming language.

The aim of charon is to provide a LISP like syntax, and a functional way
of defining programs. Charon enforces the programmer to distinguish between
the pure functions and the impure ones.

### Function purity

Charon functions must be pure by default. That is true if they follow a simple
rule: Do not invoke impure functions. That's it.

### Dealing with the state

Charon does not have any operator for mutating state. Instead, provides the term
of an atom, which in turn contains read and write operations which are impure.

Atoms are implemented outside of the language, as charon does not have any way
of "assigning" a variable as other languages do.

### Example

Syntax does resemble to _Clojurescript_:

```clojure
(def sum-two [a b]
  (+ a b))

; That's it folks!
; Impure functions tho:

(let [state (atom 0)]
  (def-impure print-state []
    (println "State: " @state))
  (def-impure count []
    (set! state
      (+ @state 1))))

; An impure main!
(def-impure impure-main []
  (print-state)
  (count)
  (print-state)
  (count)
  (print-state))

; Main must be pure!
; Opaque call allows calling impure functions from pure context, but the
; function itself is not allowed to read any state returned by the function.
(def main []
  (opaque-call impure-main))
```
