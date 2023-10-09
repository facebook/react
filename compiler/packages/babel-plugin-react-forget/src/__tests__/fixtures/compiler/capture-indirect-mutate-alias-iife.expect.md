
## Input

```javascript
function component(a) {
  let x = { a };
  (function () {
    let q = x;
    (function () {
      q.b = 1;
    })();
  })();

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
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a };

    const q = x;
    (function () {
      q.b = 1;
    })();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      