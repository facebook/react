
## Input

```javascript
function component(a, b) {
  let z = {a};
  (function () {
    mutate(z);
  })();
  let y = z;

  {
    // z is shadowed & renamed but the lambda is unaffected.
    let z = {b};
    y = {y, z};
  }
  return y;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(7);
  let z;
  if ($[0] !== a) {
    z = { a };

    mutate(z);
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }

  let y = z;
  let t0;
  if ($[2] !== b) {
    t0 = { b };
    $[2] = b;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const z_0 = t0;
  let t1;
  if ($[4] !== y || $[5] !== z_0) {
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
      