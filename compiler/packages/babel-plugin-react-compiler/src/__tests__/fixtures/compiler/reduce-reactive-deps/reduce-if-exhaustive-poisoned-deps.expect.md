
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
  const $ = _c(11);
  const { input, inputHasAB, inputHasABC } = t0;

  const t1 = !inputHasABC;
  let x;
  let t2;
  if ($[0] !== t1 || $[1] !== input.a || $[2] !== inputHasAB) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      x = [];
      if (t1) {
        let t3;
        if ($[5] !== input.a) {
          t3 = identity(input.a);
          $[5] = input.a;
          $[6] = t3;
        } else {
          t3 = $[6];
        }
        x.push(t3);
        if (!inputHasAB) {
          t2 = null;
          break bb0;
        }
        let t4;
        if ($[7] !== input.a.b) {
          t4 = identity(input.a.b);
          $[7] = input.a.b;
          $[8] = t4;
        } else {
          t4 = $[8];
        }
        x.push(t4);
      } else {
        let t3;
        if ($[9] !== input.a.b.c) {
          t3 = identity(input.a.b.c);
          $[9] = input.a.b.c;
          $[10] = t3;
        } else {
          t3 = $[10];
        }
        x.push(t3);
      }
    }
    $[0] = t1;
    $[1] = input.a;
    $[2] = inputHasAB;
    $[3] = x;
    $[4] = t2;
  } else {
    x = $[3];
    t2 = $[4];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
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