(def sum-two [a b]
  (+ a b))

; That's it folks!
; Impure functions tho:

(let [state (atom 0)]
  (def-impure print-state []
    (println "State: " (get state)))
  (def-impure count []
    (set! state
      (+ (get state) 1))))

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