
## Input

```javascript
function Component() {
  const x = 4;

  const get4 = () => {
    while (bar()) {
      if (baz) {
        bar();
      }
    }
    return () => x;
  };

  return get4;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      while (bar()) {
        if (baz) {
          bar();
        }
      }
      return () => 4;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const get4 = t0;
  return get4;
}

```
      