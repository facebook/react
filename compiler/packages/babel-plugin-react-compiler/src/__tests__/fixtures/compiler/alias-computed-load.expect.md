
## Input

```javascript
function component(a) {
  let x = {a};
  let y = {};

  y.x = x['a'];
  mutate(y);
  return x;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function component(a) {
  const $ = _c(2);
  let x;
  if ($[0] !== a) {
    x = { a };
    const y = {};

    y.x = x.a;
    mutate(y);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      