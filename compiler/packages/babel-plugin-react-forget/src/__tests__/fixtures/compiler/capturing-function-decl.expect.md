
## Input

```javascript
function component(a) {
  let t = { a };
  function x() {
    t.foo();
  }
  x(t);
  return t;
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
  let t;
  if (c_0) {
    t = { a };
    const x = function x() {
      t.foo();
    };

    x(t);
    $[0] = a;
    $[1] = t;
  } else {
    t = $[1];
  }
  return t;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      