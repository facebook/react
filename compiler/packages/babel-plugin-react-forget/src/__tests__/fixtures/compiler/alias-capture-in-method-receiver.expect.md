
## Input

```javascript
function Component() {
  // a's mutable range should be limited
  // the following line
  let a = someObj();

  let x = [];
  x.push(a);

  return [x, a];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = someObj();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const a = t0;
  let x;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    x.push(a);

    t1 = [x, a];
    $[1] = x;
    $[2] = t1;
  } else {
    x = $[1];
    t1 = $[2];
  }
  return t1;
}

```
      