
## Input

```javascript
function component(a) {
  let y = { b: { a } };
  let x = function () {
    y.b.a = 2;
  };
  x();
  return y;
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
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let y;
  if (c_0) {
    y = { b: { a } };
    const x = function () {
      y.b.a = 2;
    };

    x();
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      