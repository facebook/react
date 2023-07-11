
## Input

```javascript
function Component() {
  let x,
    y = (x = {});
  const foo = () => {
    x = getObject();
  };
  foo();
  return [y, x];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(3);
  let x;
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = x = {};

    const foo = () => {
      x = getObject();
    };

    foo();
    $[0] = x;
    $[1] = y;
  } else {
    x = $[0];
    y = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [y, x];
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      