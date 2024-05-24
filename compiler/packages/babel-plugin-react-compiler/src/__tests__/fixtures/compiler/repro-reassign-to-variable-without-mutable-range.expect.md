
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
import { c as _c } from "react/compiler-runtime"; // @debug
function Component(a, b) {
  const $ = _c(7);
  let t0;
  if ($[0] !== a || $[1] !== b) {
    const z = foo(a);
    let t1;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = [];
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    let y = t1;
    let t2;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = [];
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    let x = t2;
    if (FLAG) {
      let t3;
      if ($[5] !== b) {
        t3 = baz(b);
        $[5] = b;
        $[6] = t3;
      } else {
        t3 = $[6];
      }
      y = t3;
      x = bar(z);
    }

    t0 = [x, y];
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      