
## Input

```javascript
function Component({ a, b }) {
  return {
    x: function () {
      return [a];
    },
    y() {
      return [b];
    },
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
  const $ = useMemoCache(7);
  const { a, b } = t16;
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = function () {
      return [a];
    };
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
  const c_4 = $[4] !== t0;
  const c_5 = $[5] !== t1;
  let t2;
  if (c_4 || c_5) {
    t2 = {
      x: t0,
      y() {
        return [b];
      },
    };
    $[4] = t0;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }, { a: 2 }, { b: 2 }],
};

```
      