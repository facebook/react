
## Input

```javascript
// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in the default case.

function TestCondDepInSwitchMissingDefault(props, other) {
  const x = {};
  switch (foo(other)) {
    case 1:
      x.a = props.a.b;
      break;
    case 2:
      x.b = props.a.b;
      break;
  }
  return x;
}

```

## Code

```javascript
// props.a.b should NOT be added as a unconditional dependency to the reactive
// scope that produces x if it is not accessed in the default case.

function TestCondDepInSwitchMissingDefault(props, other) {
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
    bb1: switch (t0) {
      case 1: {
        x.a = props.a.b;
        break bb1;
      }
      case 2: {
        x.b = props.a.b;
      }
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
      