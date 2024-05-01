
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  mutate(y);
  return y;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function foo() {
  const $ = useMemoCache(1);
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [];
    y = {};
    y.x = x;
    mutate(y);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      