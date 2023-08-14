
## Input

```javascript
function component() {
  function x(a) {
    a.foo();
  }
  function x() {}
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function x() {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
};

```
      