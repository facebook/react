
## Input

```javascript
function sequence(props) {
  let x = (null, Math.max(1, 2), foo());
  while ((foo(), true)) {
    x = (foo(), 2);
  }
  return x;
}

function foo() {}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function sequence(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (Math.max(1, 2), foo());
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let x = t0;
  while ((foo(), true)) {
    x = (foo(), 2);
  }
  return x;
}

function foo() {}

```
      