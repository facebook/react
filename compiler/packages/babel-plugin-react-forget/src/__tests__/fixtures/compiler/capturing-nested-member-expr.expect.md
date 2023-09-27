
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
  const $ = useMemoCache(5);
  const c_0 = $[0] !== a;
  let t0;
  let t1;
  if (c_0) {
    t0 = { a };
    t1 = { a: t0 };
    $[0] = a;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const z = t1;
  const c_3 = $[3] !== z.a.a;
  let t2;
  if (c_3) {
    t2 = function () {
      console.log(z.a.a);
    };
    $[3] = z.a.a;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const x = t2;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      