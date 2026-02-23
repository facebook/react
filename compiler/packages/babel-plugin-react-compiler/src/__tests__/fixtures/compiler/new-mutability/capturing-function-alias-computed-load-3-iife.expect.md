
## Input

```javascript
// @enableNewMutationAliasingModel
function bar(a, b) {
  let x = [a, b];
  let y = {};
  let t = {};
  (function () {
    y = x[0][1];
    t = x[1][0];
  })();

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: bar,
  params: [
    [1, 2],
    [2, 3],
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNewMutationAliasingModel
function bar(a, b) {
  const $ = _c(6);
  let t0;
  if (!Object.is($[0], a) || !Object.is($[1], b)) {
    t0 = [a, b];
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  let y;
  if (!Object.is($[3], x[0][1]) || !Object.is($[4], x[1][0])) {
    y = {};
    let t = {};

    y = x[0][1];
    t = x[1][0];
    $[3] = x[0][1];
    $[4] = x[1][0];
    $[5] = y;
  } else {
    y = $[5];
  }

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: bar,
  params: [
    [1, 2],
    [2, 3],
  ],
};

```
      
### Eval output
(kind: ok) 2