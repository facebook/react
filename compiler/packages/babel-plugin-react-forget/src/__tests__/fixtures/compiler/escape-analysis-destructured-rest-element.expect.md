
## Input

```javascript
function Component(props) {
  // b is an object, must be memoized even though the input is not memoized
  const { a, ...b } = props.a;
  // d is an array, mut be memoized even though the input is not memoized
  const [c, ...d] = props.c;
  return <div b={b} d={d}></div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(7);
  let b;
  if ($[0] !== props.a) {
    const { a, ...t29 } = props.a;
    b = t29;
    $[0] = props.a;
    $[1] = b;
  } else {
    b = $[1];
  }
  let d;
  if ($[2] !== props.c) {
    const [c, ...t30] = props.c;
    d = t30;
    $[2] = props.c;
    $[3] = d;
  } else {
    d = $[3];
  }
  let t0;
  if ($[4] !== b || $[5] !== d) {
    t0 = <div b={b} d={d} />;
    $[4] = b;
    $[5] = d;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      