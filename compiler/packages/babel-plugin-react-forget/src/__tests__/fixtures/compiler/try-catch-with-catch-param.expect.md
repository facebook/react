
## Input

```javascript
function Component(props) {
  let x = [];
  try {
    // foo could throw its argument...
    foo(x);
  } catch (e) {
    // ... in which case this could be mutating `x`!
    e.push(null);
    return e;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    try {
      foo(x);
    } catch (t22) {
      const e = t22;

      e.push(null);
      return e;
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      