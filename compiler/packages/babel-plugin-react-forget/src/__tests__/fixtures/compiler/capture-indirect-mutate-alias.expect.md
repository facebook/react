
## Input

```javascript
function component(a) {
  let x = { a };
  const f0 = function () {
    let q = x;
    const f1 = function () {
      q.b = 1;
    };
    f1();
  };
  f0();

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
    const f0 = function () {
      const q = x;
      const f1 = function () {
        q.b = 1;
      };

      f1();
    };

    f0();
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
      