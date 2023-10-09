
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};
  const f0 = function () {
    y = x;
  };
  f0();
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
    y = {};
    const f0 = function () {
      y = x;
    };

    f0();
    mutate(y);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      