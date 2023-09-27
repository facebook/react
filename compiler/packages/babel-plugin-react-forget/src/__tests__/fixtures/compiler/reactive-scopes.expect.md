
## Input

```javascript
function f(a, b) {
  let x = []; // <- x starts being mutable here.
  if (a.length === 1) {
    if (b) {
      x.push(b); // <- x stops being mutable here.
    }
  }

  return <div>{x}</div>;
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
function f(a, b) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== a.length;
  const c_1 = $[1] !== b;
  let x;
  let t0;
  if (c_0 || c_1) {
    x = [];
    if (a.length === 1) {
      if (b) {
        x.push(b);
      }
    }

    t0 = <div>{x}</div>;
    $[0] = a.length;
    $[1] = b;
    $[2] = x;
    $[3] = t0;
  } else {
    x = $[2];
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      