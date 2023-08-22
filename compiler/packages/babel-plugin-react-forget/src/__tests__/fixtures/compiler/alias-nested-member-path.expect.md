
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
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const z = t0;
  let y;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = {};
    y.z = z;
    $[1] = y;
  } else {
    y = $[1];
  }
  let x;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    x.y = y;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```
      