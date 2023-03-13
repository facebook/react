
## Input

```javascript
// When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const x = {};
  x.a = props.a.a.a;
  if (foo(other)) {
    x.c = props.a.b.c;
  }
  return x;
}

```

## Code

```javascript
// When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== other;
  let x;
  if (c_0 || c_1) {
    x = {};
    x.a = props.a.a.a;
    if (foo(other)) {
      x.c = props.a.b.c;
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
      