
## Input

```javascript
function component(a, b) {
  let y = { b };
  let z = { a };
  let x = function () {
    z.a = 2;
    y.b;
  };
  x();
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{ a: "val1", b: "val2" }],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(5);
  let t0;
  if ($[0] !== b) {
    t0 = { b };
    $[0] = b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] !== a || $[3] !== y.b) {
    const z = { a };

    t1 = z;
    const x = function () {
      z.a = 2;
    };
    x();
    $[2] = a;
    $[3] = y.b;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{ a: "val1", b: "val2" }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"a":2}