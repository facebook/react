
## Input

```javascript
function g() {
  const x = { y: { z: 1 } };
  x.y.z = x.y.z + 1;
  x.y.z *= 2;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: g,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function g() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = { y: { z: 1 } };

    t0 = x;
    x.y.z = x.y.z + 1;
    x.y.z = x.y.z * 2;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: g,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"y":{"z":4}}