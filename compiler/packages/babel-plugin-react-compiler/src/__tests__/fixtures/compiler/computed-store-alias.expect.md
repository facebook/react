
## Input

```javascript
function component(a, b) {
  let y = { a };
  let x = { b };
  x["y"] = y;
  mutate(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(5);
  let t0;
  if ($[0] !== b || $[1] !== a) {
    const x = { b };

    t0 = x;
    mutate(x);
    let t1;
    if ($[3] !== a) {
      t1 = { a };
      $[3] = a;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const y = t1;
    x.y = y;
    $[0] = b;
    $[1] = a;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      