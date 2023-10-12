
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
  let t0;
  if ($[0] !== foo || $[1] !== bar) {
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
      