
## Input

```javascript
function component(a, b) {
  let z = { a };
  (function () {
    mutate(z);
  })();
  let y = z;

  {
    // z is shadowed & renamed but the lambda is unaffected.
    let z = { b };
    y = { y, z };
  }
  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(7);
  const c_0 = $[0] !== a;
  let z;
  if (c_0) {
    z = { a };

    mutate(z);
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }

  let y = z;
  const c_2 = $[2] !== b;
  let t0;
  if (c_2) {
    t0 = { b };
    $[2] = b;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const z_0 = t0;
  const c_4 = $[4] !== y;
  const c_5 = $[5] !== z_0;
  let t1;
  if (c_4 || c_5) {
    t1 = { y, z: z_0 };
    $[4] = y;
    $[5] = z_0;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  y = t1;
  return y;
}

```
      