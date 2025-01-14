
## Input

```javascript
function component(a) {
  let x = {a};
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
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function component(a) {
  const $ = _c(2);
  let y;
  if ($[0] !== a) {
    const x = { a };
    y = 1;

    y;
    y = x;

    mutate(y);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      