
## Input

```javascript
function Component(props) {
  // b is an object, must be memoized even though the input is not memoized
  const { a, ...b } = props.a;
  // d is an array, mut be memoized even though the input is not memoized
  const [c, ...d] = props.c;
  return <div b={b} d={d}></div>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(7);
  const c_0 = $[0] !== props.a;
  let b;
  if (c_0) {
    const { a, ...t29 } = props.a;
    b = t29;
    $[0] = props.a;
    $[1] = b;
  } else {
    b = $[1];
  }
  const c_2 = $[2] !== props.c;
  let d;
  if (c_2) {
    const [c, ...t30] = props.c;
    d = t30;
    $[2] = props.c;
    $[3] = d;
  } else {
    d = $[3];
  }
  const c_4 = $[4] !== b;
  const c_5 = $[5] !== d;
  let t0;
  if (c_4 || c_5) {
    t0 = <div b={b} d={d} />;
    $[4] = b;
    $[5] = d;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
}

```
      