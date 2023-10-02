
## Input

```javascript
function Component(props) {
  let x = mutate();
  let y;
  foo(x);
  return [y, x];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let y;
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = mutate();

    foo(x);
    $[0] = y;
    $[1] = x;
  } else {
    y = $[0];
    x = $[1];
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
      