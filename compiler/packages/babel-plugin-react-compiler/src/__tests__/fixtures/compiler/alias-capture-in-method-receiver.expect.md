
## Input

```javascript
function Component() {
  // a's mutable range should be limited
  // the following line
  let a = someObj();

  let x = [];
  x.push(a);

  return [x, a];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = someObj();

    const x = [];

    t0 = [x, a];
    x.push(a);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      