
## Input

```javascript
// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath2(props, other) {
  const x = {};
  if (foo(other)) {
    x.b = props.a.b;
  }
  x.a = props.a;
  return x;
}

```

## Code

```javascript
import * as React from "react"; // When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath2(props, other) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== other;
  const c_1 = $[1] !== props.a;
  let x;
  if (c_0 || c_1) {
    x = {};
    if (foo(other)) {
      x.b = props.a.b;
    }

    x.a = props.a;
    $[0] = other;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      