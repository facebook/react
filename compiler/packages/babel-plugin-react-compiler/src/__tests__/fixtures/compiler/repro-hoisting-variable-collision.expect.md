
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
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(5);
  let t0;
  if ($[0] !== props.items) {
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (x) => x;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    t0 = props.items.map(t1);
    $[0] = props.items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const items = t0;
  let t1;
  if ($[3] !== items) {
    t1 = [42, items];
    $[3] = items;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [0, 42, null, undefined, { object: true }] }],
};

```
      
### Eval output
(kind: ok) [42,[0,42,null,null,{"object":true}]]