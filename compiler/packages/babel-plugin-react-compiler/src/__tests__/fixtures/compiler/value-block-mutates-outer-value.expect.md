
## Input

```javascript
import { makeArray, useHook } from "shared-runtime";

/**
 * Here, the cond ? [...] : defaultList value block produces two
 * new values (each with its own scope):
 *   $0 = ["text"]
 *   $1 = { text: $0 }
 * The same value block also mutates customList, so it must be
 * merged with the scope producing customList
 */
function Foo({ defaultList, cond }) {
  const comparator = (a, b) => a - b;
  useHook();
  const customList = makeArray(1, 5, 2);
  useHook();
  const result = cond
    ? [...customList.sort(comparator), { text: ["text"] }]
    : defaultList;

  return result;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ defaultList: [2, 4], cond: true }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
import { makeArray, useHook } from "shared-runtime";

/**
 * Here, the cond ? [...] : defaultList value block produces two
 * new values (each with its own scope):
 *   $0 = ["text"]
 *   $1 = { text: $0 }
 * The same value block also mutates customList, so it must be
 * merged with the scope producing customList
 */
function Foo(t0) {
  const $ = useMemoCache(1);
  const { defaultList, cond } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (a, b) => a - b;
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const comparator = t1;
  useHook();
  const customList = makeArray(1, 5, 2);
  useHook();
  const result = cond
    ? [...customList.sort(comparator), { text: ["text"] }]
    : defaultList;
  return result;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ defaultList: [2, 4], cond: true }],
};

```
      
### Eval output
(kind: ok) [1,2,5,{"text":["text"]}]