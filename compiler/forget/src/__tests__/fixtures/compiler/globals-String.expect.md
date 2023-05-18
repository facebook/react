
## Input

```javascript
function Component(props) {
  const x = {};
  const y = String(x);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    t0 = String(x);
    $[0] = t0;
    $[1] = x;
  } else {
    t0 = $[0];
    x = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [x, y];
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      