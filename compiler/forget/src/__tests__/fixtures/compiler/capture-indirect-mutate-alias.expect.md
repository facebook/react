
## Input

```javascript
function component(a) {
  let x = { a };
  (function () {
    let q = x;
    (function () {
      q.b = 1;
    })();
  })();

  return x;
}

```

## Code

```javascript
import * as React from "react";
function component(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a };
    (function () {
      let q = x;
      (function () {
        q.b = 1;
      })();
    })();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      