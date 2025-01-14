
## Input

```javascript
function Component() {
  function callback(x) {
    if (x == 0) {
      return null;
    }
    return callback(x - 1);
  }
  return callback(10);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function Component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    function callback(x) {
      if (x == 0) {
        return null;
      }
      return callback(x - 1);
    }

    t0 = callback(10);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) null