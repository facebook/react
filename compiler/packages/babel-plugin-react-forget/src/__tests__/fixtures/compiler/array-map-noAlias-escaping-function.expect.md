
## Input

```javascript
function Component(props) {
  const f = (item) => item;
  const x = [...props.items].map(f); // `f` doesn't escape here...
  return [x, f]; // ...but it does here so it's memoized
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1 }] }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (item) => item;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const f = t0;
  const c_1 = $[1] !== props.items;
  let t1;
  if (c_1) {
    t1 = [...props.items].map(f);
    $[1] = props.items;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const x = t1;
  const c_3 = $[3] !== x;
  let t2;
  if (c_3) {
    t2 = [x, f];
    $[3] = x;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1 }] }],
  isComponent: false,
};

```
      