
## Input

```javascript
function foo(a) {
  const x = [a.b];
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function foo(a) {
  const $ = _c(2);
  let t0;
  if ($[0] !== a.b) {
    t0 = [a.b];
    $[0] = a.b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      