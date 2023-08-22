
## Input

```javascript
function Component() {
  let x = null;
  function foo() {
    x = 9;
  }
  const y = bar(foo);
  return <Child y={y} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let x;
    x = null;
    const foo = function foo() {
      x = 9;
    };

    t0 = bar(foo);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const y = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Child y={y} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      