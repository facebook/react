
## Input

```javascript
function Component(x = "default", y = [{}]) {
  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t23, t0) {
  const $ = useMemoCache(5);
  const x = t23 === undefined ? "default" : t23;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = t0 === undefined ? [{}] : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const y = t1;
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== y;
  let t2;
  if (c_2 || c_3) {
    t2 = [x, y];
    $[2] = x;
    $[3] = y;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      