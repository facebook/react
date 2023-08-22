
## Input

```javascript
function Component(props) {
  let a = props.x;
  let b;
  let c;
  let d;
  if (props.cond) {
    d = ((b = a), a++, (c = a), ++a);
  }
  return [a, b, c, d];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 2, cond: true }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  let a = props.x;
  let b;
  let c;
  let d;
  if (props.cond) {
    d = ((b = a), a++, (c = a), ++a);
  }
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  const c_3 = $[3] !== d;
  let t0;
  if (c_0 || c_1 || c_2 || c_3) {
    t0 = [a, b, c, d];
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 2, cond: true }],
  isComponent: false,
};

```
      