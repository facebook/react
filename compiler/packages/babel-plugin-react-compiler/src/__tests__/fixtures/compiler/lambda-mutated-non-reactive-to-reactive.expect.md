
## Input

```javascript
function f(a) {
  let x;
  (() => {
    x = {a};
  })();
  return <div x={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function f(a) {
  const $ = _c(4);
  let x;
  if ($[0] !== a) {
    x;
    x = { a };
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  const t0 = x;
  let t1;
  if ($[2] !== t0) {
    t1 = <div x={t0} />;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      