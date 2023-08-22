
## Input

```javascript
let someGlobal = {};
function component(a) {
  let x = { a, someGlobal };
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["value 1"],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
let someGlobal = {};
function component(a) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a, someGlobal };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["value 1"],
  isComponent: false,
};

```
      