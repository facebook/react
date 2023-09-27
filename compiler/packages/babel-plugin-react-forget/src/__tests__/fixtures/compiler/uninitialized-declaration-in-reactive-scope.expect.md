
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
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = mutate();

    foo(x);
    t0 = [y, x];
    $[0] = y;
    $[1] = x;
    $[2] = t0;
  } else {
    y = $[0];
    x = $[1];
    t0 = $[2];
  }
  return t0;
}

```
      