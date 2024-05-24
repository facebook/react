
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};
  const f0 = function () {
    y = x;
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
  let y;
  if ($[0] !== a) {
    y = {};
    const x = { a };
    const f0 = function () {
      y = x;
    };

    f0();
    mutate(y);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      