
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
import { c as _c } from "react/compiler-runtime";
function component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {};

    t0 = x;
    mutate(x.y.z);
    const y = {};
    x.y = y;
    const z = [];
    y.z = z;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      