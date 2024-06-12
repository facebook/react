
## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    const y = someObj();
    const z = y;
    x = z;
  } else {
    x = someObj();
  }

  x.f = 1;
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b, c, d) {
  const $ = _c(2);
  someObj();
  let t0;
  if ($[0] !== a) {
    let x;
    if (a) {
      const y = someObj();
      const z = y;
      x = z;
    } else {
      x = someObj();
    }

    t0 = x;
    x.f = 1;
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      