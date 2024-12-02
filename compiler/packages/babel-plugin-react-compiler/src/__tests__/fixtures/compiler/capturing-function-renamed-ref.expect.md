
## Input

```javascript
function component(a, b) {
  let z = {a};
  {
    let z = {b};
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
  const $ = _c(2);
  let t0;
  if ($[0] !== a) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;

  const z_0 = { b };

  mutate(z_0);
  return z;
}

```
      