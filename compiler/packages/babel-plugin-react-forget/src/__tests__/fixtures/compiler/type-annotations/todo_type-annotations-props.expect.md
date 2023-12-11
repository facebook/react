
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
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableUseTypeAnnotations
function useArray(items) {
  const $ = useMemoCache(3);
  let t1;
  if ($[0] !== items) {
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = (x) => x !== 0;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    t1 = items.filter(t0);
    $[0] = items;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useArray,
  params: [[1, 0, 2, 0, 3, 0, 42]],
};

```
      
### Eval output
(kind: ok) [1,2,3,42]