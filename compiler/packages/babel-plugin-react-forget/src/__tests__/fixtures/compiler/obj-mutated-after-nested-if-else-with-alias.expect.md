
## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    let z;
    if (b) {
      const w = someObj();
      z = w;
    } else {
      z = someObj();
    }
    const y = z;
    x = z;
  } else {
    x = someObj();
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c, d) {
  const $ = useMemoCache(3);
  someObj();
  let x;
  if ($[0] !== a || $[1] !== b) {
    x = undefined;
    if (a) {
      let z = undefined;
      if (b) {
        const w = someObj();
        z = w;
      } else {
        z = someObj();
      }

      x = z;
    } else {
      x = someObj();
    }

    x.f = 1;
    $[0] = a;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      