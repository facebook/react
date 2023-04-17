
## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x
  const x = makeObject(a);
  <div>{x}</div>;

  // y should depend on `x` and `b`
  const method = x.method;
  const y = method.call(x, b);
  return y;
}

```

## Code

```javascript
import * as React from "react";
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(6);
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

  const method = x.method;
  const c_2 = $[2] !== method;
  const c_3 = $[3] !== x;
  const c_4 = $[4] !== b;
  let t1;
  if (c_2 || c_3 || c_4) {
    t1 = method.call(x, b);
    $[2] = method;
    $[3] = x;
    $[4] = b;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const y = t1;
  return y;
}

```
      