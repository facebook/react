
## Input

```javascript
function component(foo, bar) {
  let x = { foo };
  let y = { bar };
  const f0 = function () {
    let a = { y };
    let b = x;
    a.x = b;
  };
  f0();
  mutate(y);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(foo, bar) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== foo;
  const c_1 = $[1] !== bar;
  let x;
  if (c_0 || c_1) {
    x = { foo };
    const y = { bar };
    const f0 = function () {
      const a = { y };
      const b = x;
      a.x = b;
    };

    f0();
    mutate(y);
    $[0] = foo;
    $[1] = bar;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      