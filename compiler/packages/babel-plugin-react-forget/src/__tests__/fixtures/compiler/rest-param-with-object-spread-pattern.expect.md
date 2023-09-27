
## Input

```javascript
function Component(foo, ...{ bar }) {
  return [foo, bar];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["foo", { bar: "bar" }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(foo, ...t9) {
  const $ = useMemoCache(3);
  const { bar } = t9;
  const c_0 = $[0] !== foo;
  const c_1 = $[1] !== bar;
  let t0;
  if (c_0 || c_1) {
    t0 = [foo, bar];
    $[0] = foo;
    $[1] = bar;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["foo", { bar: "bar" }],
};

```
      