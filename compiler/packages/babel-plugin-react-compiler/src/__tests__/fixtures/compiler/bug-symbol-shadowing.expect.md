
## Input

```javascript
class Symbol {}
function mutate() {}
function foo(cond) {
  let a = {};
  let b = {};
  let c = {};
  a = b;
  b = c;
  if (cond) {
    c = a;
  } else {
    return a;
  }
  mutate(a, b);
  return c;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [true],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
class Symbol {}
function mutate() {}
function foo(cond) {
  const $ = _c(4);
  let a;
  let c;
  let t0;
  if ($[0] !== cond) {
    t0 = globalThis.Symbol.for("react.early_return_sentinel");
    bb0: {
      let b = {};
      c = {};
      a = b;
      b = c;
      if (cond) {
        c = a;
      } else {
        t0 = a;
        break bb0;
      }

      mutate(a, b);
    }
    $[0] = cond;
    $[1] = c;
    $[2] = t0;
    $[3] = a;
  } else {
    c = $[1];
    t0 = $[2];
    a = $[3];
  }
  if (t0 !== globalThis.Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
  return c;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [true],
};

```
      
### Eval output
(kind: ok) {}