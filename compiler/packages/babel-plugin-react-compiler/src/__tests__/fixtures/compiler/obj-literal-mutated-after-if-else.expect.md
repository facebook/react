
## Input

```javascript
function foo(a, b, c, d) {
  let x = {};
  if (someVal) {
    x = {b};
  } else {
    x = {c};
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function foo(a, b, c, d) {
  const $ = _c(3);
  let x;
  if ($[0] !== b || $[1] !== c) {
    if (someVal) {
      x = { b };
    } else {
      x = { c };
    }

    x.f = 1;
    $[0] = b;
    $[1] = c;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      