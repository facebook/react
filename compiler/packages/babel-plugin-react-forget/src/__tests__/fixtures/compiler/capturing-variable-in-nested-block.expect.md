
## Input

```javascript
function component(a) {
  let z = { a };
  let x = function () {
    {
      console.log(z);
    }
  };
  return x;
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
  const $ = useMemoCache(4);
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
  const c_2 = $[2] !== z;
  let t1;
  if (c_2) {
    t1 = function () {
      console.log(z);
    };
    $[2] = z;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const x = t1;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      