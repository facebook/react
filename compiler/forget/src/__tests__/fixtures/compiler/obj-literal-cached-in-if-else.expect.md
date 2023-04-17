
## Input

```javascript
function foo(a, b, c, d) {
  let x = {};
  if (someVal) {
    x = { b };
  } else {
    x = { c };
  }

  return x;
}

```

## Code

```javascript
import * as React from "react";
function foo(a, b, c, d) {
  const $ = React.unstable_useMemoCache(4);
  let x = undefined;
  if (someVal) {
    const c_0 = $[0] !== b;
    let t0;
    if (c_0) {
      t0 = { b };
      $[0] = b;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    x = t0;
  } else {
    const c_2 = $[2] !== c;
    let t1;
    if (c_2) {
      t1 = { c };
      $[2] = c;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    x = t1;
  }
  return x;
}

```
      