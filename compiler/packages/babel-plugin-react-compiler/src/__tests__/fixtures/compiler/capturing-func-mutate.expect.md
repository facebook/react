
## Input

```javascript
function component(a, b) {
  let z = {a};
  let y = {b};
  let x = function () {
    z.a = 2;
    console.log(y.b);
  };
  x();
  return z;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(3);
  let z;
  if ($[0] !== a || $[1] !== b) {
    z = { a };
    const y = { b };
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
      