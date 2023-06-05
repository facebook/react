
## Input

```javascript
function g() {
  const x = { y: { z: 1 } };
  x.y.z = x.y.z + 1;
  x.y.z *= 2;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function g() {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = { y: { z: 1 } };
    x.y.z = x.y.z + 1;
    x.y.z = x.y.z * 2;
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      