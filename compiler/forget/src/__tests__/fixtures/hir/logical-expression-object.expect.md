
## Input

```javascript
function component(props) {
  // The mutable range for a extens the entire body.
  // commenting out the last line of InferMutableRanges fixes it.
  // my guess of what's going on is that a is aliased into the return value object literal,
  // and that alias makes it look like the range of a needs to be extended to that point.
  // but what's weird is that the end of a's range doesn't quite extend to the object.
  let a = props.a || (props.b && props.c && props.d);
  let b = (props.a && props.b && props.c) || props.d;
  return { a, b };
}

```

## Code

```javascript
function component(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = props.a || (props.b && props.c && props.d);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const a = t0;
  const c_2 = $[2] !== props;
  let t1;
  if (c_2) {
    t1 = (props.a && props.b && props.c) || props.d;
    $[2] = props;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const b = t1;
  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t2;
  if (c_4 || c_5) {
    t2 = { a: a, b: b };
    $[4] = a;
    $[5] = b;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      