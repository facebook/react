
## Input

```javascript
function foo(a, b, c) {
  const x = [a];
  const y = [null, b];
  const z = [[], [], [c]];
  x[0] = y[1];
  z[0][0] = x[0];
  return [x, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [1, 2, 3],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a, b, c) {
  const $ = _c(6);
  let t0;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    const x = [a];
    let t1;
    if ($[4] !== b) {
      t1 = [null, b];
      $[4] = b;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    const y = t1;
    const z = [[], [], [c]];
    x[0] = y[1];
    z[0][0] = x[0];
    t0 = [x, z];
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
  params: [1, 2, 3],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [[2],[[2],[],[3]]]