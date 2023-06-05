
## Input

```javascript
function foo(a, b) {
  const x = [];
  x.push(a);
  <div>{x}</div>;

  const y = [];
  if (x.length) {
    y.push(x);
  }
  if (b) {
    y.push(b);
  }
  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = [];
    x.push(a);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== b;
  let y;
  if (c_2 || c_3) {
    y = [];
    if (x.length) {
      y.push(x);
    }
    if (b) {
      y.push(b);
    }
    $[2] = x;
    $[3] = b;
    $[4] = y;
  } else {
    y = $[4];
  }
  return y;
}

```
      