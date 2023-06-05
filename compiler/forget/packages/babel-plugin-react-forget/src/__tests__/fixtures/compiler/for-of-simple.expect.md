
## Input

```javascript
function Component() {
  let x = [];
  let items = [0, 1, 2];
  for (const ii of items) {
    x.push(ii * 2);
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    const items = [0, 1, 2];
    for (const ii of items) {
      x.push(ii * 2);
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      