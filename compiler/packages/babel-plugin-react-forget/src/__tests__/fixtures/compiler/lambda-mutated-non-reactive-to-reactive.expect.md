
## Input

```javascript
function f(a) {
  let x;
  (() => {
    x = { a };
  })();
  return <div x={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function f(a) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    (() => {
      x = { a };
    })();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const t0 = x;
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = <div x={t0} />;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      