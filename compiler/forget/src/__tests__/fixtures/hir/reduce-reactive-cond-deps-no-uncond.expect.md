
## Input

```javascript
// When an object's properties are only read conditionally, we should
// track the base object as a dependency.
function TestOnlyConditionalDependencies(props, other) {
  const x = {};
  if (foo(other)) {
    x.b = props.a.b;
    x.c = props.a.b.c;
  }
  return x;
}

```

## Code

```javascript
// When an object's properties are only read conditionally, we should
// track the base object as a dependency.
function TestOnlyConditionalDependencies(props, other) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== other;
  const c_1 = $[1] !== props;
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
      x.b = props.a.b;
      x.c = props.a.b.c;
    }
    $[0] = other;
    $[1] = props;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      