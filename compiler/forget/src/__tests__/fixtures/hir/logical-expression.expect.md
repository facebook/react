
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
  let t1;
  if (c_0) {
    t1 = props.a || (props.b && props.c && props.d);
    $[0] = props;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const a = t1;
  const c_2 = $[2] !== props;
  let t3;
  if (c_2) {
    t3 = (props.a && props.b && props.c) || props.d;
    $[2] = props;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const b = t3;
  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  const c_6 = $[6] !== props;
  let t7;
  if (c_4 || c_5 || c_6) {
    t7 = a ? b : props.c;
    $[4] = a;
    $[5] = b;
    $[6] = props;
    $[7] = t7;
  } else {
    t7 = $[7];
  }
  return t7;
}

```
      