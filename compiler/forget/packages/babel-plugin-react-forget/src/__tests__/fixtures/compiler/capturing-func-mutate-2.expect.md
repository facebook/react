
## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  x();
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== b;
  let t0;
  if (c_0) {
    t0 = { b };
    $[0] = b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  const c_2 = $[2] !== a;
  const c_3 = $[3] !== y.b;
  let x;
  if (c_2 || c_3) {
    const z = { a };
    x = function () {
      z.a = 2;
      y.b;
    };
    x();
    $[2] = a;
    $[3] = y.b;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

```
      