
## Input

```javascript
function f(a) {
  let x;
  (() => {
    x = {};
  })();
  // this is not reactive on `x` as `x` is never reactive
  return <div x={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function f(a) {
  const $ = useMemoCache(2);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    (() => {
      x = {};
    })();
    $[0] = x;
  } else {
    x = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div x={x} />;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      