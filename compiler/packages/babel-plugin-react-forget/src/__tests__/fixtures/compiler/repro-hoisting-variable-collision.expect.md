
## Input

```javascript
function Component(props) {
  const items = props.items.map((x) => x);
  const x = 42;
  return [x, items];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [0, 42, null, undefined, { object: true }] }],
  isComponent: "Component",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  let t1;
  if ($[0] !== props.items) {
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = (x) => x;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    t1 = props.items.map(t0);
    $[0] = props.items;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const items = t1;
  let t2;
  if ($[3] !== items) {
    t2 = [42, items];
    $[3] = items;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [0, 42, null, undefined, { object: true }] }],
  isComponent: "Component",
};

```
      