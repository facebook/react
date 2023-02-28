
## Input

```javascript
// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath2(props, other) {
  const x = {};
  if (foo(other)) {
    x.a = props.a;
  }
  x.b = props.a.b;
  return x;
}

```

## Code

```javascript
// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath2(props, other) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== other;
  const c_1 = $[1] !== props.a;
  let x;
  if (c_0 || c_1) {
    x = {};
    const c_3 = $[3] !== other;
    let t0;
    if (c_3) {
      t0 = foo(other);
      $[3] = other;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    if (t0) {
      x.a = props.a;
    }
    x.b = props.a.b;
    $[0] = other;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      