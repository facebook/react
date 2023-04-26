
## Input

```javascript
function bar(a, b) {
  let x = [a, b];
  let y = {};
  let t = {};
  (function () {
    y = x[0][1];
    t = x[1][0];
  })();

  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function bar(a, b) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  let y;
  if (c_0 || c_1) {
    const x = [a, b];
    y = {};
    const t = {};
    (function () {
      y = x[0][1];
      t = x[1][0];
    })();
    $[0] = a;
    $[1] = b;
    $[2] = y;
  } else {
    y = $[2];
  }
  return y;
}

```
      