
## Input

```javascript
function component(a, b) {
  let z = { a };
  {
    let z = { b };
    (function () {
      mutate(z);
    })();
  }
  return z;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(5);
  let z;
  if ($[0] !== b || $[1] !== a) {
    const z_0 = { b };
    let t0;
    if ($[3] !== a) {
      t0 = { a };
      $[3] = a;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    z = t0;

    mutate(z_0);
    $[0] = b;
    $[1] = a;
    $[2] = z;
  } else {
    z = $[2];
  }
  return z;
}

```
      