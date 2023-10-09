
## Input

```javascript
function component(a) {
  let x = { a };
  let y = 1;
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let y;
  if (c_0) {
    const x = { a };
    y = 1;

    y;
    y = x;

    mutate(y);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      