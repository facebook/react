
## Input

```javascript
function foo(a, b, c, d) {
  let x = {};
  if (someVal) {
    x = { b };
  } else {
    x = { c };
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
  let x;
  if ($[0] !== b || $[1] !== c) {
    if (someVal) {
      x = { b };
    } else {
      x = { c };
    }

    x.f = 1;
    $[0] = b;
    $[1] = c;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      