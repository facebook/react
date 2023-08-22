
## Input

```javascript
// @debug
function Component(a, b) {
  let x = [];
  let y = [];
  let z = foo(a);
  if (FLAG) {
    x = bar(z);
    y = baz(b);
  }
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(a, b) {
  const $ = useMemoCache(11);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let x = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let y = t1;
  const c_2 = $[2] !== a;
  const c_3 = $[3] !== b;
  if (c_2 || c_3) {
    const z = foo(a);
    if (FLAG) {
      x = bar(z);
      const c_6 = $[6] !== b;
      let t2;
      if (c_6) {
        t2 = baz(b);
        $[6] = b;
        $[7] = t2;
      } else {
        t2 = $[7];
      }
      y = t2;
    }
    $[2] = a;
    $[3] = b;
    $[4] = x;
    $[5] = y;
  } else {
    x = $[4];
    y = $[5];
  }
  const c_8 = $[8] !== x;
  const c_9 = $[9] !== y;
  let t3;
  if (c_8 || c_9) {
    t3 = [x, y];
    $[8] = x;
    $[9] = y;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  return t3;
}

```
      