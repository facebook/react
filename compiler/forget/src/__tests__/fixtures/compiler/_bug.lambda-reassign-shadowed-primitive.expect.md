
## Input

```javascript
function Component() {
  const x = {};
  {
    let x = 56;
    const fn = function () {
      x = 42;
    };
    fn();
  }
  return x; // should return {}
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;

  let x_0 = 56;
  const fn = function () {
    x_0 = 42;
  };
  fn();
  return x;
}

```
      