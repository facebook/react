
## Input

```javascript
function component(t) {
  let { a } = t;
  let y = { a };
  return y;
}

```

## Code

```javascript
import * as React from "react";
function component(t) {
  const $ = React.unstable_useMemoCache(2);
  const { a } = t;
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  return y;
}

```
      