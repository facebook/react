
## Input

```javascript
function component(a, b) {
  let z = { a };
  let y = b;
  let x = function () {
    if (y) {
      mutate(z);
    }
  };
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  const y = b;
  const c_2 = $[2] !== y;
  const c_3 = $[3] !== z;
  let t1;
  if (c_2 || c_3) {
    t1 = function () {
      if (y) {
        mutate(z);
      }
    };
    $[2] = y;
    $[3] = z;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const x = t1;
  return x;
}

```
      