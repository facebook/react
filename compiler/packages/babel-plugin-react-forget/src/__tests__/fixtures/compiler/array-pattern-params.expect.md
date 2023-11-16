
## Input

```javascript
function component([a, b]) {
  let y = { a };
  let z = { b };
  return [y, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [["val1", "val2"]],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(t16) {
  const $ = useMemoCache(7);
  const [a, b] = t16;
  let t0;
  if ($[0] !== a) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] !== b) {
    t1 = { b };
    $[2] = b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const z = t1;
  let t2;
  if ($[4] !== y || $[5] !== z) {
    t2 = [y, z];
    $[4] = y;
    $[5] = z;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [["val1", "val2"]],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [{"a":"val1"},{"b":"val2"}]