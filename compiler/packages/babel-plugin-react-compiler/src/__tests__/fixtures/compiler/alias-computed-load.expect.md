
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
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const y = {};

  mutate(y);
  y.x = x.a;
  return x;
}

```
      