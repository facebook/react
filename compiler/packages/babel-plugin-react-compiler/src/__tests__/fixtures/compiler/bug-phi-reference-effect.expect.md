
## Input

```javascript
import { arrayPush } from "shared-runtime";

/**
 * Evaluator error:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [2]
 *   [2]
 *   Forget:
 *   (kind: ok) [2]
 *   [2,2]
 */
function Foo(cond) {
  let x = null;
  if (cond) {
    x = [];
  } else {
  }
  // Here, x = phi(x$null, x$[]) does not receive the correct ValueKind
  arrayPush(x, 2);

  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: true }],
  sequentialRenders: [{ cond: true }, { cond: true }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { arrayPush } from "shared-runtime";

/**
 * Evaluator error:
 *   Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) [2]
 *   [2]
 *   Forget:
 *   (kind: ok) [2]
 *   [2,2]
 */
function Foo(cond) {
  const $ = _c(1);
  let x = null;
  if (cond) {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = [];
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    x = t0;
  }

  arrayPush(x, 2);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: true }],
  sequentialRenders: [{ cond: true }, { cond: true }],
};

```
      