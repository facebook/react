
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
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c, d) {
  const $ = useMemoCache(4);
  let x = undefined;
  if (someVal) {
    let t0;
    if ($[0] !== b) {
      t0 = { b };
      $[0] = b;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    x = t0;
  } else {
    let t1;
    if ($[2] !== c) {
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
      