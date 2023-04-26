
## Input

```javascript
function component(a, b) {
  let z = { a };
  {
    let z = { b };
    (function () {
      mutate(z);
    })();
  }
  return z;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;

  const z_0 = { b };
  (function () {
    mutate(z_0);
  })();
  return z;
}

```
      