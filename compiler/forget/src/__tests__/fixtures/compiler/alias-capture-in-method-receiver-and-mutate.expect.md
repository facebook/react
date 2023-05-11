
## Input

```javascript
function Component() {
  // a's mutable range should be the same as x's mutable range,
  // since a is captured into x (which gets mutated later)
  let a = someObj();

  let x = [];
  x.push(a);

  mutate(x);
  return [x, a];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(3);
  let x;
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = someObj();

    x = [];
    x.push(a);

    mutate(x);
    $[0] = x;
    $[1] = a;
  } else {
    x = $[0];
    a = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [x, a];
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      