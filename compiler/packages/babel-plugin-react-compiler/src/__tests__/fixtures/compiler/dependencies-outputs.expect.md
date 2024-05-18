
## Input

```javascript
function foo(a, b) {
  const x = [];
  x.push(a);
  <div>{x}</div>;

  const y = [];
  if (x.length) {
    y.push(x);
  }
  if (b) {
    y.push(b);
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b) {
  const $ = _c(2);
  let y;
  if ($[0] !== a) {
    const x = [];
    x.push(a);

    y = [];
    if (x.length) {
      y.push(x);
    }
    if (b) {
      y.push(b);
    }
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      