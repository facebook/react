
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
  const $ = _c(3);
  let t0;
  if ($[0] !== b || $[1] !== a) {
    const x = { b };

    t0 = x;
    const y = { a };
    x.y = y;
    mutate(x);
    $[0] = b;
    $[1] = a;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      