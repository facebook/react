
## Input

```javascript
function component() {
  let p = makePrimitive();
  p + p; // infer p as primitive
  let o = {};

  let x = {};

  x.t = p; // infer x.t as primitive
  let z = x.t;

  x.t = o; // generalize x.t
  let y = x.t;
  return y;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(2);
  const p = makePrimitive();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const o = t0;
  let x;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};

    x.t = p;

    x.t = o;
    $[1] = x;
  } else {
    x = $[1];
  }
  const y = x.t;
  return y;
}

```
      