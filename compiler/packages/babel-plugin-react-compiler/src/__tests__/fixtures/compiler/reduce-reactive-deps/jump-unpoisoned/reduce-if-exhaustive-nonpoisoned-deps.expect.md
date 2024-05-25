
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
  const $ = _c(7);
  let x;
  let t1;
  if ($[0] !== t0) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const { input, hasAB, returnNull } = t0;
      x = [];
      if (!hasAB) {
        let t2;
        if ($[3] !== input.a) {
          t2 = identity(input.a);
          $[3] = input.a;
          $[4] = t2;
        } else {
          t2 = $[4];
        }
        x.push(t2);
        if (!returnNull) {
          t1 = null;
          break bb0;
        }
      } else {
        let t2;
        if ($[5] !== input.a.b) {
          t2 = identity(input.a.b);
          $[5] = input.a.b;
          $[6] = t2;
        } else {
          t2 = $[6];
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
  params: [{ input: { b: 1 }, hasAB: false, returnNull: false }],
};

```
      
### Eval output
(kind: ok) null