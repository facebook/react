
## Input

```javascript
import { makeObject_Primitives, mutate } from "shared-runtime";

function Component() {
  // a's mutable range should be the same as x's mutable range,
  // since a is captured into x (which gets mutated later)
  let a = makeObject_Primitives();

  let x = [];
  x.push(a);

  mutate(x);
  return [x, a];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { makeObject_Primitives, mutate } from "shared-runtime";

function Component() {
  const $ = useMemoCache(3);
  let x;
  let a;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = makeObject_Primitives();

    x = [];
    x.push(a);

    mutate(x);
    t0 = [x, a];
    $[0] = x;
    $[1] = a;
    $[2] = t0;
  } else {
    x = $[0];
    a = $[1];
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: false,
};

```
      