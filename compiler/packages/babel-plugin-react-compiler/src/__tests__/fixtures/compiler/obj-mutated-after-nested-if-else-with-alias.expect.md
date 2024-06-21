
## Input

```javascript
function foo(a, b, c, d) {
  let x = someObj();
  if (a) {
    let z;
    if (b) {
      const w = someObj();
      z = w;
    } else {
      z = someObj();
    }
    const y = z;
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
  const $ = _c(3);
  someObj();
  let t0;
  if ($[0] !== a || $[1] !== b) {
    let x;
    if (a) {
      let z;
      if (b) {
        const w = someObj();
        z = w;
      } else {
        z = someObj();
      }

      x = z;
    } else {
      x = someObj();
    }

    t0 = x;
    x.f = 1;
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      