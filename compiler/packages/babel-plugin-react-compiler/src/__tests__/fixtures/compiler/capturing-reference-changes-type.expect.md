
## Input

```javascript
function component(a) {
  let x = { a };
  let y = 1;
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
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
    let y;
    y = 1;

    y;
    y = x;

    t0 = y;
    mutate(y);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      