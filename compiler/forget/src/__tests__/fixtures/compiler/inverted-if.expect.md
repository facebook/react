
## Input

```javascript
function foo(a, b, c, d) {
  let y = [];
  label: if (a) {
    if (b) {
      y.push(c);
      break label;
    }
    y.push(d);
  }
  return y;
}

```

## Code

```javascript
import * as React from "react";
function foo(a, b, c, d) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  const c_3 = $[3] !== d;
  let y;
  if (c_0 || c_1 || c_2 || c_3) {
    y = [];
    bb1: {
      if (a) {
        if (b) {
          y.push(c);
          break bb1;
        }

        y.push(d);
      }
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = y;
  } else {
    y = $[4];
  }
  return y;
}

```
      