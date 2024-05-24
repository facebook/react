
## Input

```javascript
// @enableReactiveScopesInHIR:false
import { identity, mutate } from "shared-runtime";

/**
 * The root cause of this bug is in `InferReactiveScopeVariables`. Currently,
 * InferReactiveScopeVariables do not ensure that maybe-aliased values get
 * assigned the same reactive scope. This is safe only when an already-
 * constructed value is captured, e.g.
 * ```js
 * const x = makeObj();  ⌝ mutable range of x
 * mutate(x);            ⌟
 *                       <-- after this point, we can produce a canonical version
 *                           of x for all following aliases
 * const y = [];
 * y.push(x);            <-- y captures x
 * ```
 *
 * However, if a value is captured/aliased during its mutable range and the
 * capturing container is separately memoized, it becomes difficult to guarantee
 * that all aliases refer to the same value.
 *
 * Sprout error:
 * Found differences in evaluator results
 * Non-forget (expected):
 * (kind: ok) [{"wat0":"joe"},3]
 * [{"wat0":"joe"},3]
 * Forget:
 * (kind: ok) [{"wat0":"joe"},3]
 * [[ (exception in render) Error: oh no! ]]
 *
 */
function useFoo({ a, b }) {
  const x = { a };
  const y = {};
  mutate(x);
  const z = [identity(y), b];
  mutate(y);

  if (z[0] !== y) {
    throw new Error("oh no!");
  }
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: 2, b: 3 }],
  sequentialRenders: [
    { a: 2, b: 3 },
    { a: 4, b: 3 },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveScopesInHIR:false
import { identity, mutate } from "shared-runtime";

/**
 * The root cause of this bug is in `InferReactiveScopeVariables`. Currently,
 * InferReactiveScopeVariables do not ensure that maybe-aliased values get
 * assigned the same reactive scope. This is safe only when an already-
 * constructed value is captured, e.g.
 * ```js
 * const x = makeObj();  ⌝ mutable range of x
 * mutate(x);            ⌟
 *                       <-- after this point, we can produce a canonical version
 *                           of x for all following aliases
 * const y = [];
 * y.push(x);            <-- y captures x
 * ```
 *
 * However, if a value is captured/aliased during its mutable range and the
 * capturing container is separately memoized, it becomes difficult to guarantee
 * that all aliases refer to the same value.
 *
 * Sprout error:
 * Found differences in evaluator results
 * Non-forget (expected):
 * (kind: ok) [{"wat0":"joe"},3]
 * [{"wat0":"joe"},3]
 * Forget:
 * (kind: ok) [{"wat0":"joe"},3]
 * [[ (exception in render) Error: oh no! ]]
 *
 */
function useFoo(t0) {
  const $ = _c(6);
  let a;
  let t1;
  let z;
  if ($[0] !== t0) {
    const y = {};
    const { a: t2, b } = t0;
    a = t2;
    let t3;
    if ($[4] !== b) {
      t3 = [identity(y), b];
      $[4] = b;
      $[5] = t3;
    } else {
      t3 = $[5];
    }
    z = t3;

    t1 = z[0] !== y;
    mutate(y);
    $[0] = t0;
    $[1] = a;
    $[2] = t1;
    $[3] = z;
  } else {
    a = $[1];
    t1 = $[2];
    z = $[3];
  }
  const x = { a };
  mutate(x);
  if (t1) {
    throw new Error("oh no!");
  }
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: 2, b: 3 }],
  sequentialRenders: [
    { a: 2, b: 3 },
    { a: 4, b: 3 },
  ],
};

```
      