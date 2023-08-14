
## Input

```javascript
function Component() {
  const x = [];
  for (const item of [1, 2]) {
    if (item === 1) {
      break;
    }
    x.push(item);
  }
  return x;
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
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = [1, 2];
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    for (const item of t0) {
      if (item === 1) {
        break;
      }

      x.push(item);
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      