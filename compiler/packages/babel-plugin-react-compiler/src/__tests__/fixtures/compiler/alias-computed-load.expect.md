
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};

  y.x = x["a"];
  mutate(y);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a) {
  const $ = _c(2);
  let t0;
  if ($[0] !== a) {
    const x = { a };

    t0 = x;
    const y = {};
    y.x = x.a;
    mutate(y);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      