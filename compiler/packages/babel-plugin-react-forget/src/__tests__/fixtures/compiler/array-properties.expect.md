
## Input

```javascript
function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.length;
  const y = a.push;
  return { a, x, y, z: a.concat };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: [1, 2], b: 2 }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(7);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let t0;
  if (c_0 || c_1) {
    t0 = [props.a, props.b, "hello"];
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const a = t0;
  const x = a.length;
  const y = a.push;
  const c_3 = $[3] !== a;
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== y;
  let t1;
  if (c_3 || c_4 || c_5) {
    t1 = { a, x, y, z: a.concat };
    $[3] = a;
    $[4] = x;
    $[5] = y;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: [1, 2], b: 2 }],
  isComponent: false,
};

```
      