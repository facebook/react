
## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    x = someObj();
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
  const $ = useMemoCache(2);
  someObj();
  let x;
  if ($[0] !== a) {
    x = undefined;
    if (a) {
      x = someObj();
    } else {
      x = someObj();
    }

    x.f = 1;
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      