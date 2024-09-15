
## Input

```javascript
function component(a, b) {
  let y = {a};
  let x = {b};
  x['y'] = y;
  mutate(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(3);
  let x;
  if ($[0] !== a || $[1] !== b) {
    const y = { a };
    x = { b };
    x.y = y;
    mutate(x);
    $[0] = a;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      