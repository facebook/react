
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
  const $ = useMemoCache(2);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = mutate();
    let y;
    foo(x);
    $[0] = x;
  } else {
    x = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [y, x];
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      