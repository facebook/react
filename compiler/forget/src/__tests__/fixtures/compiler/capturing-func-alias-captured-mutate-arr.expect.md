
## Input

```javascript
function component(foo, bar) {
  let x = { foo };
  let y = { bar };
  (function () {
    let a = [y];
    let b = x;
    a.x = b;
  })();
  mutate(y);
  return y;
}

```

## Code

```javascript
import * as React from "react";
function component(foo, bar) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== foo;
  const c_1 = $[1] !== bar;
  let y;
  if (c_0 || c_1) {
    const x = { foo };
    y = { bar };
    (function () {
      let a = [y];
      let b = x;
      a.x = b;
    })();
    mutate(y);
    $[0] = foo;
    $[1] = bar;
    $[2] = y;
  } else {
    y = $[2];
  }
  return y;
}

```
      