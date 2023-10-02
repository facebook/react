
## Input

```javascript
function Component({ a, b, c }) {
  return {
    x: [a],
    y() {
      return [b];
    },
    z: { c },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }, { a: 2 }, { b: 2 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t16) {
  const $ = useMemoCache(10);
  const { a, b, c } = t16;
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = [a];
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== b;
  let t1;
  if (c_2) {
    $[2] = b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const c_4 = $[4] !== c;
  let t2;
  if (c_4) {
    t2 = { c };
    $[4] = c;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const c_6 = $[6] !== t0;
  const c_7 = $[7] !== t1;
  const c_8 = $[8] !== t2;
  let t3;
  if (c_6 || c_7 || c_8) {
    t3 = {
      x: t0,
      y() {
        return [b];
      },
      z: t2,
    };
    $[6] = t0;
    $[7] = t1;
    $[8] = t2;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }, { a: 2 }, { b: 2 }],
};

```
      