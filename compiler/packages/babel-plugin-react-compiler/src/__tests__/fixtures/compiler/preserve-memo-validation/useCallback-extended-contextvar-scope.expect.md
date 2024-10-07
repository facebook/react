
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees:true

import {useCallback} from 'react';
import {Stringify, useIdentity} from 'shared-runtime';

/**
 * Here, the *inferred* dependencies of cb are `a` and `t1 = LoadContext capture x_@1`.
 * - t1 does not have a scope as it captures `x` after x's mutable range
 * - `x` is a context variable, which means its mutable range extends to all
 *    references / aliases.
 * - `a`, `b`, and `x` get the same mutable range due to potential aliasing.
 *
 * We currently bail out because `a` has a scope and is not transitively memoized
 * (as its scope is pruned due to a hook call)
 */
function useBar({a, b}, cond) {
  let x = useIdentity({val: 3});
  if (cond) {
    x = b;
  }

  const cb = useCallback(() => {
    return [a, x];
  }, [a, x]);

  return <Stringify cb={cb} shouldInvoke={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useBar,
  params: [{a: 1, b: 2}, true],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees:true

import { useCallback } from "react";
import { Stringify, useIdentity } from "shared-runtime";

/**
 * Here, the *inferred* dependencies of cb are `a` and `t1 = LoadContext capture x_@1`.
 * - t1 does not have a scope as it captures `x` after x's mutable range
 * - `x` is a context variable, which means its mutable range extends to all
 *    references / aliases.
 * - `a`, `b`, and `x` get the same mutable range due to potential aliasing.
 *
 * We currently bail out because `a` has a scope and is not transitively memoized
 * (as its scope is pruned due to a hook call)
 */
function useBar(t0, cond) {
  const $ = _c(6);
  const { a, b } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = { val: 3 };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let x;
  x = useIdentity(t1);
  if (cond) {
    x = b;
  }

  const t2 = x;
  let t3;
  if ($[1] !== a || $[2] !== t2) {
    t3 = () => [a, x];
    $[1] = a;
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  x;
  const cb = t3;
  let t4;
  if ($[4] !== cb) {
    t4 = <Stringify cb={cb} shouldInvoke={true} />;
    $[4] = cb;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useBar,
  params: [{ a: 1, b: 2 }, true],
};

```
      
### Eval output
(kind: ok) <div>{"cb":"[[ function params=0 ]]","shouldInvoke":true}</div>