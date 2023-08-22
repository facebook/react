
## Input

```javascript
function component(a, b) {
  let z = { a };
  let y = { b };
  let x = function () {
    z.a = 2;
    console.log(y.b);
  };
  x();
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
  const $ = useMemoCache(3);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  let z;
  if (c_0 || c_1) {
    z = { a };
    const y = { b };
    const x = function () {
      z.a = 2;
      console.log(y.b);
    };

    x();
    $[0] = a;
    $[1] = b;
    $[2] = z;
  } else {
    z = $[2];
  }
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      