
## Input

```javascript
// @enableUseTypeAnnotations
function useArray(items: Array<number>) {
  // With type information we know that the callback cannot escape
  // and does not need to be memoized, only the result needs to be
  // memoized:
  return items.filter((x) => x !== 0);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useArray,
  params: [[1, 0, 2, 0, 3, 0, 42]],
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime"; // @enableUseTypeAnnotations
function useArray(items) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] !== items) {
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (x) => x !== 0;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    t0 = items.filter(t1);
    $[0] = items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useArray,
  params: [[1, 0, 2, 0, 3, 0, 42]],
};

```
      
### Eval output
(kind: ok) [1,2,3,42]