
## Input

```javascript
function foo(x, y, z) {
  const items = [z];
  items.push(x);

  const items2 = [];
  if (x) {
    items2.push(y);
  }

  if (y) {
    items.push(x);
  }

  return items2;
}

```

## Code

```javascript
import * as React from "react";
function foo(x, y, z) {
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== z;
  const c_1 = $[1] !== x;
  const c_2 = $[2] !== y;
  let items2;
  if (c_0 || c_1 || c_2) {
    const items = [z];
    items.push(x);
    const c_4 = $[4] !== x;
    const c_5 = $[5] !== y;
    if (c_4 || c_5) {
      items2 = [];
      if (x) {
        items2.push(y);
      }
      $[4] = x;
      $[5] = y;
      $[6] = items2;
    } else {
      items2 = $[6];
    }
    if (y) {
      items.push(x);
    }
    $[0] = z;
    $[1] = x;
    $[2] = y;
    $[3] = items2;
  } else {
    items2 = $[3];
  }
  return items2;
}

```
      