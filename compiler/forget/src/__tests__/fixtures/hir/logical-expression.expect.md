
## Input

```javascript
function component(props) {
  let a = props.a || (props.b && props.c && props.d);
  let b = (props.a && props.b && props.c) || props.d;
  return a ? b : props.c;
}

```

## Code

```javascript
function component(props) {
  const $ = React.useMemoCache();
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
  const c_6 = $[6] !== props;
  let t2;
  if (c_4 || c_5 || c_6) {
    t2 = a ? b : props.c;
    $[4] = a;
    $[5] = b;
    $[6] = props;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

```
      