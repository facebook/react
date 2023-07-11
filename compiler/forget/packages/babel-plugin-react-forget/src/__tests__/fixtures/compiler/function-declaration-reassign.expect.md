
## Input

```javascript
function component() {
  function x(a) {
    a.foo();
  }
  x = {};
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function x(a) {
      a.foo();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let x;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x = t0;

    x = {};
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      