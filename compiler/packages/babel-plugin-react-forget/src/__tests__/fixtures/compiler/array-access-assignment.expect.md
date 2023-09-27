
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
  const $ = useMemoCache(8);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  let z;
  let t1;
  if (c_0 || c_1 || c_2) {
    x = [a];
    const c_6 = $[6] !== b;
    let t0;
    if (c_6) {
      t0 = [null, b];
      $[6] = b;
      $[7] = t0;
    } else {
      t0 = $[7];
    }
    const y = t0;
    z = [[], [], [c]];
    x[0] = y[1];
    z[0][0] = x[0];
    t1 = [x, z];
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
    $[4] = z;
    $[5] = t1;
  } else {
    x = $[3];
    z = $[4];
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [1, 2, 3],
  isComponent: false,
};

```
      