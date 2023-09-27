
## Input

```javascript
function component(a) {
  let z = { a: { a } };
  let x = function () {
    console.log(z.a.a);
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
    t0 = { a: { a } };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  const c_2 = $[2] !== z.a.a;
  let t1;
  if (c_2) {
    t1 = function () {
      console.log(z.a.a);
    };
    $[2] = z.a.a;
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
      