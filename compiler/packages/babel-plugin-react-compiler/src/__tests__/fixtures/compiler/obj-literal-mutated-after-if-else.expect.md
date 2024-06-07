
## Input

```javascript
function foo(a, b, c, d) {
  let x = {};
  if (someVal) {
    x = { b };
  } else {
    x = { c };
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b, c, d) {
  const $ = _c(3);
  let t0;
  if ($[0] !== b || $[1] !== c) {
    let x;
    if (someVal) {
      x = { b };
    } else {
      x = { c };
    }

    t0 = x;
    x.f = 1;
    $[0] = b;
    $[1] = c;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      