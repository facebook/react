
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
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function component() {
  const $ = _c(1);
  const p = makePrimitive();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const o = {};

    x = {};

    x.t = p;

    x.t = o;
    $[0] = x;
  } else {
    x = $[0];
  }
  const y = x.t;
  return y;
}

```
      