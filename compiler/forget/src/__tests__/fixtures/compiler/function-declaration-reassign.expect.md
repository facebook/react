
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
import * as React from "react";
function component() {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

```
      