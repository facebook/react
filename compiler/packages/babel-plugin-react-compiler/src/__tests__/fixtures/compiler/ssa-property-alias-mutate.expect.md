
## Input

```javascript
function foo() {
  const a = {};
  const x = a;

  const y = {};
  y.x = x;

  mutate(a); // y & x are aliased to a
  return y;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = {};
    const x = a;

    const y = {};

    t0 = y;
    y.x = x;
    mutate(a);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      