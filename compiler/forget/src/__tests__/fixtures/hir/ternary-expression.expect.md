
## Input

```javascript
function ternary(props) {
  const a = props.a && props.b ? props.c || props.d : props.e ?? props.f;
  const b = props.a ? (props.b && props.c ? props.d : props.e) : props.f;
  return a ? b : null;
}

```

## Code

```javascript
function ternary(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = props.a && props.b ? props.c || props.d : props.e ?? props.f;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const a = t0;
  const c_2 = $[2] !== props;
  let t1;
  if (c_2) {
    t1 = props.a ? (props.b && props.c ? props.d : props.e) : props.f;
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
    t2 = a ? b : null;
    $[4] = a;
    $[5] = b;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      