
## Input

```javascript
function foo() {
  const x = {};
  const y = foo(x);
  y.mutate();
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {};

    t0 = x;
    const y = foo(x);
    y.mutate();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      