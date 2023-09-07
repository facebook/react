
## Input

```javascript
function Component(props) {
  let x;
  try {
    x = foo();
  } catch {
    x = null;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let x = undefined;
  try {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = foo();
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    x = t0;
  } catch {
    x = null;
  }
  return x;
}

```
      