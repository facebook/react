
## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x, y
  const x = makeObject(a);
  const y = makeObject(a);
  <div>
    {x}
    {y}
  </div>;

  // z should depend on `x`, `y.method`, and `b`
  const z = x[y.method](b);
  return z;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b, c) {
  const $ = _c(6);
  let t0;
  if ($[0] !== a) {
    t0 = makeObject(a);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  const y = makeObject(a);
  let t1;
  if ($[2] !== x || $[3] !== y.method || $[4] !== b) {
    t1 = x[y.method](b);
    $[2] = x;
    $[3] = y.method;
    $[4] = b;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const z = t1;
  return z;
}

```
      