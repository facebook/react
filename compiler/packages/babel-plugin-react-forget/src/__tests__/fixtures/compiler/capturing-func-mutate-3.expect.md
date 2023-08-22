
## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      