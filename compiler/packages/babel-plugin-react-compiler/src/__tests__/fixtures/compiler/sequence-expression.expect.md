
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
import { c as _c } from "react/compiler-runtime";
function sequence(props) {
  const $ = _c(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (Math.max(1, 2), foo());
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let x = t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    while ((foo(), true)) {
      x = (foo(), 2);
    }
    $[1] = x;
  } else {
    x = $[1];
  }

  return x;
}

function foo() {}

```
      