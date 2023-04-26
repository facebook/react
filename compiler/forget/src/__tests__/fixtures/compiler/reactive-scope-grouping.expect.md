
## Input

```javascript
function foo() {
  let x = {};
  let y = [];
  let z = {};
  y.push(z);
  x.y = y;

  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo() {
  const $ = useMemoCache(3);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    let y;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      y = [];
      let t0;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {};
        $[2] = t0;
      } else {
        t0 = $[2];
      }
      const z = t0;
      y.push(z);
      $[1] = y;
    } else {
      y = $[1];
    }
    x.y = y;
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      