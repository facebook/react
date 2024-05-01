
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};
  const f0 = function () {
    y["x"] = x;
  };
  f0();
  mutate(y);
  return y;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(2);
  let y;
  if ($[0] !== a) {
    const x = { a };
    y = {};
    const f0 = function () {
      y.x = x;
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
      