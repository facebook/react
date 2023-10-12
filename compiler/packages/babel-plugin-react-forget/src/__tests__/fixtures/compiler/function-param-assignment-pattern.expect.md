
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
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? [{}] : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const y = t1;
  let t2;
  if ($[2] !== x || $[3] !== y) {
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
      