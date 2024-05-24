
## Input

```javascript
import { identity } from "shared-runtime";

function useFoo({ input, hasAB, returnNull }) {
  const x = [];
  if (!hasAB) {
    x.push(identity(input.a));
    if (!returnNull) {
      return null;
    }
  } else {
    x.push(identity(input.a.b));
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ input: { b: 1 }, hasAB: false, returnNull: false }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

function useFoo(t0) {
  const $ = _c(9);
  const { input, hasAB, returnNull } = t0;

  const t1 = !hasAB;
  let x;
  let t2;
  if ($[0] !== t1 || $[1] !== returnNull || $[2] !== input.a) {
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
        if (!returnNull) {
          t2 = null;
          break bb0;
        }
      } else {
        let t3;
        if ($[7] !== input.a.b) {
          t3 = identity(input.a.b);
          $[7] = input.a.b;
          $[8] = t3;
        } else {
          t3 = $[8];
        }
        x.push(t3);
      }
    }
    $[0] = t1;
    $[1] = returnNull;
    $[2] = input.a;
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
  params: [{ input: { b: 1 }, hasAB: false, returnNull: false }],
};

```
      
### Eval output
(kind: ok) null