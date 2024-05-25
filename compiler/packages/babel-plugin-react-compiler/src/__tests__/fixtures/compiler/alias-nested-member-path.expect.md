
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const z = [];
    const y = {};
    y.z = z;
    const x = {};

    t0 = x;
    x.y = y;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"y":{"z":[]}}