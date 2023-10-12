
## Input

```javascript
function foo(a, b, c) {
  const x = [a];
  const y = [null, b];
  const z = [[], [], [c]];
  x[0] = y[1];
  z[0][0] = x[0];
  return [x, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [1, 2, 3],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c) {
  const $ = useMemoCache(10);
  let x;
  let z;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    x = [a];
    let t0;
    if ($[5] !== b) {
      t0 = [null, b];
      $[5] = b;
      $[6] = t0;
    } else {
      t0 = $[6];
    }
    const y = t0;
    z = [[], [], [c]];
    x[0] = y[1];
    z[0][0] = x[0];
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
    $[4] = z;
  } else {
    x = $[3];
    z = $[4];
  }
  let t1;
  if ($[7] !== x || $[8] !== z) {
    t1 = [x, z];
    $[7] = x;
    $[8] = z;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [1, 2, 3],
  isComponent: false,
};

```
      