
## Input

```javascript
// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

import { identity } from "shared-runtime";

function useCondDepInDirectIfElse(props, cond) {
  const x = {};
  if (identity(cond)) {
    x.b = props.a.b;
  } else {
    x.c = props.a.b;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useCondDepInDirectIfElse,
  params: [{ a: { b: 2 } }, true],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

import { identity } from "shared-runtime";

function useCondDepInDirectIfElse(props, cond) {
  const $ = _c(5);
  let t0;
  if ($[0] !== cond) {
    t0 = identity(cond);
    $[0] = cond;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let x;
  if ($[2] !== t0 || $[3] !== props.a.b) {
    x = {};
    if (t0) {
      x.b = props.a.b;
    } else {
      x.c = props.a.b;
    }
    $[2] = t0;
    $[3] = props.a.b;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useCondDepInDirectIfElse,
  params: [{ a: { b: 2 } }, true],
};

```
      
### Eval output
(kind: ok) {"b":2}