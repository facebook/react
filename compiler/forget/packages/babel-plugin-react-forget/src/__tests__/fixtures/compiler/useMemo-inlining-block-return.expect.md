
## Input

```javascript
function component(a, b) {
  let x = useMemo(() => {
    if (a) {
      return { b };
    }
  }, [a, b]);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(2);
  let t14 = undefined;
  bb6: {
    if (a) {
      const c_0 = $[0] !== b;
      let t0;
      if (c_0) {
        t0 = { b };
        $[0] = b;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      t14 = t0;
      break bb6;
    }
    t14 = undefined;
  }
  const x = t14;
  return x;
}

```
      