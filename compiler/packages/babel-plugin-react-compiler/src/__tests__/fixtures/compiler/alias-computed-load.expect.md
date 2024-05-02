
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
import { c as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(2);
  let x;
  if ($[0] !== a) {
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
      