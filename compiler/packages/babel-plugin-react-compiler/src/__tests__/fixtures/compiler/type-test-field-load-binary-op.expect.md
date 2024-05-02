
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
import { c as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeSomePrimitive();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = { u: t0, v: makeSomePrimitive() };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  const u = x.u;
  const v = x.v;
  if (u > v) {
  }

  const z = x.v;
  return z;
}

```
      