
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    let y = [];
    if (b) {
      y.push(c);
    }

    x.push(y);
  }
  return x;
}

```

## Code

```javascript
import * as React from "react";
function foo(a, b, c) {
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];
    if (a) {
      const c_4 = $[4] !== b;
      const c_5 = $[5] !== c;
      let y;
      if (c_4 || c_5) {
        y = [];
        if (b) {
          y.push(c);
        }
        $[4] = b;
        $[5] = c;
        $[6] = y;
      } else {
        y = $[6];
      }

      x.push(y);
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      