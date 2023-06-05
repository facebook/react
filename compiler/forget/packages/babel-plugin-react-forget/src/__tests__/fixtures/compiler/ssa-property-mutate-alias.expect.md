
## Input

```javascript
function foo() {
  const a = {};
  const y = a;
  const x = [];

  y.x = x;

  mutate(a); // y & x are aliased to a
  return y;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo() {
  const $ = useMemoCache(1);
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = {};
    y = a;
    const x = [];

    y.x = x;

    mutate(a);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      