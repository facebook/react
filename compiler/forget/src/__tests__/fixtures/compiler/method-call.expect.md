
## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x
  const x = makeObject(a);
  <div>{x}</div>;

  // y should depend on `x` and `b`
  const y = x.foo(b);
  return y;
}

```

## Code

```javascript
import * as React from "react";
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = makeObject(a);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== b;
  let t1;
  if (c_2 || c_3) {
    t1 = x.foo(b);
    $[2] = x;
    $[3] = b;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const y = t1;
  return y;
}

```
      