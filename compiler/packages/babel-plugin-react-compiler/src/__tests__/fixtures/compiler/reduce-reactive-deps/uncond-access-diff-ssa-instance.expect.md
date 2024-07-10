
## Input

```javascript
function useFoo(a, b, c) {
  let x = {};
  write(x, a);

  const y = [];
  if (x.a != null) {
    y.push(x.a.b);
  }
  y.push(b);

  x = makeThing();
  write(x.a.b);

  return [y, x.a.b];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function useFoo(a, b, c) {
  const $ = _c(9);
  let x;
  if ($[0] !== a) {
    x = {};
    write(x, a);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  let y;
  if ($[2] !== x.a || $[3] !== b) {
    y = [];
    if (x.a != null) {
      y.push(x.a.b);
    }

    y.push(b);
    $[2] = x.a;
    $[3] = b;
    $[4] = y;
  } else {
    y = $[4];
  }
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    x = makeThing();
    write(x.a.b);
    $[5] = x;
  } else {
    x = $[5];
  }
  let t0;
  if ($[6] !== y || $[7] !== x.a.b) {
    t0 = [y, x.a.b];
    $[6] = y;
    $[7] = x.a.b;
    $[8] = t0;
  } else {
    t0 = $[8];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented