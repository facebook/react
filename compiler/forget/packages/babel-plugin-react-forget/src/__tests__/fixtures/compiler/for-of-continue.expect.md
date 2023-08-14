
## Input

```javascript
function Component() {
  const x = [0, 1, 2, 3];
  const ret = [];
  for (const item of x) {
    if (item === 0) {
      continue;
    }
    ret.push(item / 2);
  }
  return ret;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [0, 1, 2, 3];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let ret;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    ret = [];
    for (const item of x) {
      if (item === 0) {
        continue;
      }

      ret.push(item / 2);
    }
    $[1] = ret;
  } else {
    ret = $[1];
  }
  return ret;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      