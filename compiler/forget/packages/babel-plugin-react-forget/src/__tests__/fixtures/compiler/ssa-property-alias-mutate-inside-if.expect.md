
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
    mutate(y); // aliases x & y, but not z
  } else {
    let z = {};
    x.z = z;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = {};
    if (a) {
      const y = {};
      x.y = y;
      mutate(y);
    } else {
      let t0;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = {};
        $[2] = t0;
      } else {
        t0 = $[2];
      }
      const z = t0;
      x.z = z;
    }
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      