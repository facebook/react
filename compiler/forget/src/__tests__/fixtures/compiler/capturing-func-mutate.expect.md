
## Input

```javascript
function component(a, b) {
  let z = { a };
  let y = { b };
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
import * as React from "react";
function component(a, b) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  let x;
  if (c_0 || c_1) {
    const z = { a };
    const c_3 = $[3] !== b;
    let t0;
    if (c_3) {
      t0 = { b };
      $[3] = b;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    const y = t0;
    x = function () {
      z.a = 2;
      y.b;
    };
    x();
    $[0] = a;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      