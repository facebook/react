
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
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = String(x);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const y = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [x, y];
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      