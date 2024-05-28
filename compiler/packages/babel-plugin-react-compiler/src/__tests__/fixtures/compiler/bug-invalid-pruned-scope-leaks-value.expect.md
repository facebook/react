
## Input

```javascript
import invariant from "invariant";
import {
  makeObject_Primitives,
  mutate,
  sum,
  useIdentity,
} from "shared-runtime";

/**
 * Exposes fundamental issue with pruning 'non-reactive' dependencies + flattening
 * those scopes. Here, `z`'s original memo block is removed due to the inner hook call.
 * However, we also infer that `z` is non-reactive and does not need to be a memo
 * dependency.
 *
 * Current evaluator error:
 *  Found differences in evaluator results
 *  Non-forget (expected):
 *  (kind: ok) [4,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  [4,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  [5,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  Forget:
 *  (kind: ok) [4,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  [[ (exception in render) Invariant Violation: oh no! ]]
 *  [5,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 */

function MyApp({ count }) {
  const z = makeObject_Primitives();
  const x = useIdentity(2);
  const y = sum(x, count);
  mutate(z);
  const thing = [y, z];
  if (thing[1] !== z) {
    invariant(false, "oh no!");
  }
  return thing;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [{ count: 2 }],
  sequentialRenders: [{ count: 2 }, { count: 2 }, { count: 3 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import invariant from "invariant";
import {
  makeObject_Primitives,
  mutate,
  sum,
  useIdentity,
} from "shared-runtime";

/**
 * Exposes fundamental issue with pruning 'non-reactive' dependencies + flattening
 * those scopes. Here, `z`'s original memo block is removed due to the inner hook call.
 * However, we also infer that `z` is non-reactive and does not need to be a memo
 * dependency.
 *
 * Current evaluator error:
 *  Found differences in evaluator results
 *  Non-forget (expected):
 *  (kind: ok) [4,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  [4,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  [5,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  Forget:
 *  (kind: ok) [4,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 *  [[ (exception in render) Invariant Violation: oh no! ]]
 *  [5,{"a":0,"b":"value1","c":true,"wat0":"joe"}]
 */

function MyApp(t0) {
  const $ = _c(5);
  const { count } = t0;
  const z = makeObject_Primitives();
  const x = useIdentity(2);
  let t1;
  if ($[0] !== x || $[1] !== count) {
    t1 = sum(x, count);
    $[0] = x;
    $[1] = count;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const y = t1;
  mutate(z);
  let t2;
  if ($[3] !== y) {
    t2 = [y, z];
    $[3] = y;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const thing = t2;
  if (thing[1] !== z) {
    invariant(false, "oh no!");
  }
  return thing;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [{ count: 2 }],
  sequentialRenders: [{ count: 2 }, { count: 2 }, { count: 3 }],
};

```
      