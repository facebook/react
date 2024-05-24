
## Input

```javascript
function foo(a, b, c) {
  // Construct and freeze x
  const x = makeObject(a);
  <div>{x}</div>;

  // y should depend on `x` and `b`
  const method = x.method;
  const y = method.call(x, b);
  return y;
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

    const method = x.method;
    t0 = method.call(x, b);
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const y = t0;
  return y;
}

```
      