
## Input

```javascript
// @enableUseTypeAnnotations
function useArray(items: Array<number>) {
  // With type information we know that the callback cannot escape
  // and does not need to be memoized, only the result needs to be
  // memoized:
  return items.filter(x => x !== 0);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useArray,
  params: [[1, 0, 2, 0, 3, 0, 42]],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableUseTypeAnnotations
function useArray(items) {
  const $ = _c(2);
  let t0;
  if ($[0] !== items) {
    t0 = items.filter(_temp);
    $[0] = items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
function _temp(x) {
  return x !== 0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useArray,
  params: [[1, 0, 2, 0, 3, 0, 42]],
};

```
      
### Eval output
(kind: ok) [1,2,3,42]