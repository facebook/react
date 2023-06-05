
## Input

```javascript
function bar(a) {
  let x = [a];
  let y = {};
  (function () {
    y = x[0].a[1];
  })();

  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function bar(a) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let y;
  if (c_0) {
    const x = [a];
    y = {};
    (function () {
      y = x[0].a[1];
    })();
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      