
## Input

```javascript
// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`

import { identity } from "shared-runtime";

// ordering of accesses should not matter
function useConditionalSubpath2(props, other) {
  const x = {};
  if (identity(other)) {
    x.a = props.a;
  }
  x.b = props.a.b;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useConditionalSubpath2,
  params: [{ a: { b: 3 } }, false],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`

import { identity } from "shared-runtime";

// ordering of accesses should not matter
function useConditionalSubpath2(props, other) {
  const $ = _c(5);
  let t0;
  if ($[0] !== other) {
    t0 = identity(other);
    $[0] = other;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0 || $[3] !== props.a) {
    const x = {};
    if (t0) {
      x.a = props.a;
    }

    t1 = x;
    x.b = props.a.b;
    $[2] = t0;
    $[3] = props.a;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useConditionalSubpath2,
  params: [{ a: { b: 3 } }, false],
};

```
      
### Eval output
(kind: ok) {"b":3}