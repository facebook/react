
## Input

```javascript
function foo() {
  const x = {};
  const y = foo(x);
  y.mutate();
  return x;
}

```

## Code

```javascript
import * as React from "react";
function foo() {
  const $ = React.unstable_useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    const y = foo(x);
    y.mutate();
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      