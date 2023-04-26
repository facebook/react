
## Input

```javascript
// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath1(props, other) {
  const x = {};
  x.b = props.a.b;
  if (foo(other)) {
    x.a = props.a;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath1(props, other) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== other;
  let x;
  if (c_0 || c_1) {
    x = {};
    x.b = props.a.b;
    if (foo(other)) {
      x.a = props.a;
    }
    $[0] = props.a;
    $[1] = other;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      