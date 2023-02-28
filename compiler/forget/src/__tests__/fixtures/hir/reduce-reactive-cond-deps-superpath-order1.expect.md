
## Input

```javascript
// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath1(props, other) {
  const x = {};
  x.a = props.a;
  if (foo(other)) {
    x.b = props.a.b;
  }
  return x;
}

```

## Code

```javascript
// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath1(props, other) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== other;
  let x;
  if (c_0 || c_1) {
    x = {};
    x.a = props.a;
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
      x.b = props.a.b;
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
      