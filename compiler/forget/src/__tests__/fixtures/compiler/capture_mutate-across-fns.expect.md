
## Input

```javascript
function component(a) {
  let z = { a };
  (function () {
    (function () {
      z.b = 1;
    })();
  })();
  return z;
}

```

## Code

```javascript
import * as React from "react";
function component(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let z;
  if (c_0) {
    z = { a };
    (function () {
      (function () {
        z.b = 1;
      })();
    })();
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }
  return z;
}

```
      