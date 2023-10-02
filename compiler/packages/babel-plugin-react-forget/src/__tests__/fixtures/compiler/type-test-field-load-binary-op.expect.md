
## Input

```javascript
function component() {
  let x = { u: makeSomePrimitive(), v: makeSomePrimitive() };
  let u = x.u;
  let v = x.v;
  if (u > v) {
  }

  let y = x.u;
  let z = x.v;
  return z;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeSomePrimitive();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = makeSomePrimitive();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = { u: t0, v: t1 };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const x = t2;
  const u = x.u;
  const v = x.v;
  if (u > v) {
  }

  const z = x.v;
  return z;
}

```
      