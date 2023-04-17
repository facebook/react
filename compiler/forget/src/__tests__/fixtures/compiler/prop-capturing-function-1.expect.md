
## Input

```javascript
function component(a, b) {
  let z = { a, b };
  let x = function () {
    z;
  };
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
  let t0;
  if (c_0 || c_1) {
    t0 = { a, b };
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const z = t0;
  const c_3 = $[3] !== z;
  let t1;
  if (c_3) {
    t1 = function () {
      z;
    };
    $[3] = z;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const x = t1;
  return x;
}

```
      