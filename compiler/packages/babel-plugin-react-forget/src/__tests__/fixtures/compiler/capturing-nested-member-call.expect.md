
## Input

```javascript
function component(a) {
  let z = { a: { a } };
  let x = function () {
    z.a.a();
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
function component(a) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== a;
  let t0;
  let t1;
  if (c_0) {
    t0 = { a };
    t1 = { a: t0 };
    $[0] = a;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const z = t1;
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      