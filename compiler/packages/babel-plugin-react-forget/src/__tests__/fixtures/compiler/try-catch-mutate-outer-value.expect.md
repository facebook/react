
## Input

```javascript
function Component(props) {
  const x = [];
  try {
    x.push(foo());
  } catch {
    x.push(bar());
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    try {
      let t0;
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = foo();
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      x.push(t0);
    } catch {
      let t1;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = bar();
        $[2] = t1;
      } else {
        t1 = $[2];
      }
      x.push(t1);
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      