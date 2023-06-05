
## Input

```javascript
function component() {
  let x = { t: 1 };
  let p = x.t;
  return p;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { t: 1 };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  const p = x.t;
  return p;
}

```
      