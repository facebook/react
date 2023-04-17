
## Input

```javascript
// @inlineUseMemo
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
import * as React from "react"; // @inlineUseMemo
function component(a, b) {
  const $ = React.unstable_useMemoCache(2);
  let t14 = undefined;
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
  } else {
    t14 = undefined;
  }
  const x = t14;
  return x;
}

```
      