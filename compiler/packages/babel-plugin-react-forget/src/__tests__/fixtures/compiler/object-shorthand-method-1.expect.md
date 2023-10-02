
## Input

```javascript
// @debug
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
  params: [{ x: 1 }, { a: 2 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(t16) {
  const $ = useMemoCache(4);
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
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = {
      x: t0,
      y() {
        return [b];
      },
    };
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }, { a: 2 }],
};

```
      