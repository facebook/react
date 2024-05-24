
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
  const $ = _c(3);
  let t0;
  if ($[0] !== a || $[1] !== b) {
    const x = makeObject(a);
    const y = makeObject(a);

    t0 = x[y.method](b);
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const z = t0;
  return z;
}

```
      