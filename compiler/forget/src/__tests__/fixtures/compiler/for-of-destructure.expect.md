
## Input

```javascript
function Component() {
  let x = [];
  let items = [{ v: 0 }, { v: 1 }, { v: 2 }];
  for (const { v } of items) {
    x.push(v * 2);
  }
  return x;
}

```

## Code

```javascript
import * as React from "react";
function Component() {
  const $ = React.unstable_useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    const items = [{ v: 0 }, { v: 1 }, { v: 2 }];
    for (const { v } of items) {
      x.push(v * 2);
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      