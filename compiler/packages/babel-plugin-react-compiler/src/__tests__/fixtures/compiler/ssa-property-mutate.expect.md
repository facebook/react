
## Input

```javascript
function foo() {
  const x = [];
  const y = {};
  y.x = x;
  mutate(y);
  return y;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function foo() {
  const $ = _c(1);
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [];
    y = {};
    y.x = x;
    mutate(y);
    $[0] = y;
  } else {
    y = $[0];
  }
  return y;
}

```
      