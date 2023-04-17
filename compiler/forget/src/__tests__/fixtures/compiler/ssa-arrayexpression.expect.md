
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = [a, b];
  return x;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [1, 2];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

```
      