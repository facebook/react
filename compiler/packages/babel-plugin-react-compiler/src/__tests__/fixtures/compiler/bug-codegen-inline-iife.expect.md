
## Input

```javascript
import {makeArray, print} from 'shared-runtime';

/**
 * Exposes bug involving iife inlining + codegen.
 * We currently inline iifes to labeled blocks (not value-blocks).
 *
 * Here, print(1) and the evaluation of makeArray(...) get the same scope
 * as the compiler infers that the makeArray call may mutate its arguments.
 * Since print(1) does not get its own scope (and is thus not a declaration
 * or dependency), it does not get promoted.
 * As a result, print(1) gets reordered across the labeled-block instructions
 * to be inlined at the makeArray callsite.
 *
 * Current evaluator results:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [null,2]
 *   logs: [1,2]
 *   Forget:
 *   (kind: ok) [null,2]
 *   logs: [2,1]
 */
function useTest() {
  return makeArray<number | void>(
    print(1),
    (function foo() {
      print(2);
      return 2;
    })(),
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: useTest,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { makeArray, print } from "shared-runtime";

/**
 * Exposes bug involving iife inlining + codegen.
 * We currently inline iifes to labeled blocks (not value-blocks).
 *
 * Here, print(1) and the evaluation of makeArray(...) get the same scope
 * as the compiler infers that the makeArray call may mutate its arguments.
 * Since print(1) does not get its own scope (and is thus not a declaration
 * or dependency), it does not get promoted.
 * As a result, print(1) gets reordered across the labeled-block instructions
 * to be inlined at the makeArray callsite.
 *
 * Current evaluator results:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [null,2]
 *   logs: [1,2]
 *   Forget:
 *   (kind: ok) [null,2]
 *   logs: [2,1]
 */
function useTest() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let t1;

    print(2);
    t1 = 2;
    t0 = makeArray(print(1), t1);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useTest,
  params: [],
};

```
      