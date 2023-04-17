
## Input

```javascript
function component(a) {
  let t = { a };
  function x(p) {
    p.foo();
  }
  x(t);
  return t;
}

```

## Code

```javascript
import * as React from "react";
function component(a) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== a;
  let t;
  if (c_0) {
    t = { a };
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = function x(p) {
        p.foo();
      };
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    const x = t0;
    x(t);
    $[0] = a;
    $[1] = t;
  } else {
    t = $[1];
  }
  return t;
}

```
      