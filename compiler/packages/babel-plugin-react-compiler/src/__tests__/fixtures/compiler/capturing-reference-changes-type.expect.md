
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
import { c as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(2);
  let y;
  if ($[0] !== a) {
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
      