
## Input

```javascript
function foo(a, b, c) {
  const x = { a: a };
  // NOTE: this array should memoize independently from x, w only b,c as deps
  x.y = [b, c];

  return x;
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
function foo(a, b, c) {
  const $ = _c(7);
  let t0;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    const x = { a };

    t0 = x;
    let t1;
    if ($[4] !== b || $[5] !== c) {
      t1 = [b, c];
      $[4] = b;
      $[5] = c;
      $[6] = t1;
    } else {
      t1 = $[6];
    }
    x.y = t1;
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      