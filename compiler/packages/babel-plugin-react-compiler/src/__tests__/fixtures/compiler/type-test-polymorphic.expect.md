
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
import { c as _c } from "react/compiler-runtime";
function component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {};

    const y = x.t;
    t0 = y;
    const o = {};
    x.t = o;
    const p = makePrimitive();
    x.t = p;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      