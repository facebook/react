
## Input

```javascript
import { identity } from "shared-runtime";

function useFoo({ input, inputHasAB, inputHasABC }) {
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
  params: [{ input: { b: 1 }, inputHasAB: false, inputHasABC: false }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(9);
  let x;
  let t1;
  if ($[0] !== t0) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const { input, inputHasAB, inputHasABC } = t0;
      x = [];
      if (!inputHasABC) {
        let t2;
        if ($[3] !== input.a) {
          t2 = identity(input.a);
          $[3] = input.a;
          $[4] = t2;
        } else {
          t2 = $[4];
        }
        x.push(t2);
        if (!inputHasAB) {
          t1 = null;
          break bb0;
        }
        let t3;
        if ($[5] !== input.a.b) {
          t3 = identity(input.a.b);
          $[5] = input.a.b;
          $[6] = t3;
        } else {
          t3 = $[6];
        }
        x.push(t3);
      } else {
        let t2;
        if ($[7] !== input.a.b.c) {
          t2 = identity(input.a.b.c);
          $[7] = input.a.b.c;
          $[8] = t2;
        } else {
          t2 = $[8];
        }
        x.push(t2);
      }
    }
    $[0] = t0;
    $[1] = x;
    $[2] = t1;
  } else {
    x = $[1];
    t1 = $[2];
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