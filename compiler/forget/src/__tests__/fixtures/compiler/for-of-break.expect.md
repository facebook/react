
## Input

```javascript
function Component() {
  const x = [];
  for (const item of [1, 2]) {
    break;
  }
  return x;
}

```

## Code

```javascript
import * as React from "react";
function Component() {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  for (const item of [1, 2]) {
    break;
  }
  return x;
}

```
      