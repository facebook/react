
## Input

```javascript
// When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access

import { identity } from "shared-runtime";

// and promote it to an unconditional dependency.
function usePromoteUnconditionalAccessToDependency(props, other) {
  const x = {};
  x.a = props.a.a.a;
  if (identity(other)) {
    x.c = props.a.b.c;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: usePromoteUnconditionalAccessToDependency,
  params: [{ a: { a: { a: 3 } } }, false],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access

import { identity } from "shared-runtime";

// and promote it to an unconditional dependency.
function usePromoteUnconditionalAccessToDependency(props, other) {
  const $ = _c(5);
  let t0;
  if ($[0] !== other) {
    t0 = identity(other);
    $[0] = other;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let x;
  if ($[2] !== props.a || $[3] !== t0) {
    x = {};
    x.a = props.a.a.a;
    if (t0) {
      x.c = props.a.b.c;
    }
    $[2] = props.a;
    $[3] = t0;
    $[4] = x;
  } else {
    x = $[4];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: usePromoteUnconditionalAccessToDependency,
  params: [{ a: { a: { a: 3 } } }, false],
};

```
      
### Eval output
(kind: ok) {"a":3}