
## Input

```javascript
function component(a) {
  let z = { a };
  let x = function () {
    let z;
    mutate(z);
  };
  return x;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function component(a) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function () {
      let z_0;
      mutate(z_0);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

```
      