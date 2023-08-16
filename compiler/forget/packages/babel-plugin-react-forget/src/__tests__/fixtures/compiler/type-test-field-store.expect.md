
## Input

```javascript
function component() {
  let x = {};
  let q = {};
  x.t = q;
  let z = x.t;
  return z;
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
  const $ = useMemoCache(2);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = {};
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    const q = t0;
    x.t = q;
    $[0] = x;
  } else {
    x = $[0];
  }
  const z = x.t;
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```
      