
## Input

```javascript
function Component(props) {
  const x = [];
  x.push(props.value);
  const { length: y } = x;
  foo(y);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props.value;
  let x;
  if (c_0) {
    x = [];
    x.push(props.value);
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  const { length: y } = x;
  foo(y);
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== y;
  let t0;
  if (c_2 || c_3) {
    t0 = [x, y];
    $[2] = x;
    $[3] = y;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```
      