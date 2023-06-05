
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  mutate(x.y.z);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const z = [];
    const y = {};
    y.z = z;
    x = {};
    x.y = y;
    mutate(x.y.z);
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      