
## Input

```javascript
// @debug
function Component(props) {
  let x = [];
  try {
    const y = foo();
    if (y == null) {
      return;
    }
    x.push(bar(y));
  } catch {
    return null;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(props) {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    try {
      const y = foo();
      if (y == null) {
        return;
      }

      x.push(bar(y));
    } catch {
      return null;
    }
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      