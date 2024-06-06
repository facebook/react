
## Input

```javascript
function component(a, b) {
  let z = { a };
  let y = { b };
  let x = function () {
    z.a = 2;
    console.log(y.b);
  };
  x();
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(5);
  let z;
  if ($[0] !== a || $[1] !== b) {
    z = { a };
    let t0;
    if ($[3] !== b) {
      t0 = { b };
      $[3] = b;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    const y = t0;
    const x = function () {
      z.a = 2;
      console.log(y.b);
    };

    x();
    $[0] = a;
    $[1] = b;
    $[2] = z;
  } else {
    z = $[2];
  }
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      