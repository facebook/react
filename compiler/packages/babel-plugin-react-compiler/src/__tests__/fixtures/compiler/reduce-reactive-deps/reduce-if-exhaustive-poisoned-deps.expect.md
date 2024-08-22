
## Input

```javascript
import {identity} from 'shared-runtime';

function useFoo({input, inputHasAB, inputHasABC}) {
  const x = [];
  if (!inputHasABC) {
    x.push(identity(input.a));
    if (!inputHasAB) {
      return null;
    }
    x.push(identity(input.a.b));
  } else {
    x.push(identity(input.a.b.c));
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{input: {b: 1}, inputHasAB: false, inputHasABC: false}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(7);
  const { input, inputHasAB, inputHasABC } = t0;
  let x;
  let t1;
  if ($[0] !== inputHasABC || $[1] !== input.a || $[2] !== inputHasAB) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      x = [];
      if (!inputHasABC) {
        x.push(identity(input.a));
        if (!inputHasAB) {
          t1 = null;
          break bb0;
        }

        x.push(identity(input.a.b));
      } else {
        let t2;
        if ($[5] !== input.a.b.c) {
          t2 = identity(input.a.b.c);
          $[5] = input.a.b.c;
          $[6] = t2;
        } else {
          t2 = $[6];
        }
        x.push(t2);
      }
    }
    $[0] = inputHasABC;
    $[1] = input.a;
    $[2] = inputHasAB;
    $[3] = x;
    $[4] = t1;
  } else {
    x = $[3];
    t1 = $[4];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ input: { b: 1 }, inputHasAB: false, inputHasABC: false }],
};

```
      
### Eval output
(kind: ok) null