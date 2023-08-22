
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};

  y.x = x["a"];
  mutate(y);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a };
    const y = {};

    y.x = x.a;
    mutate(y);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      