
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};
  const f0 = function () {
    y.x = x;
  };
  f0();
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
    const y = {};

    t0 = y;
    const f0 = function () {
      y.x = x;
    };
    f0();
    mutate(y);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      