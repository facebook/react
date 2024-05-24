
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
  const $ = _c(3);
  let t0;
  if ($[0] !== a || $[1] !== b) {
    const z = { a };

    t0 = z;
    const y = { b };
    const x = function () {
      z.a = 2;
    };
    x();
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{ a: "val1", b: "val2" }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {"a":2}