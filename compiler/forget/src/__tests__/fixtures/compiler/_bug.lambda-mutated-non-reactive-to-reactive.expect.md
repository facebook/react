
## Input

```javascript
function f(a) {
  let x;
  (() => {
    x = { a };
  })();
  return <div x={x} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function f(a) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    (() => {
      x = { a };
    })();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div x={x} />;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      