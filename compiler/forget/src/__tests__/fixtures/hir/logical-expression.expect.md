
## Input

```javascript
function component(props) {
  let a = props.a || (props.b && props.c && props.d);
  let b = (props.a && props.b && props.c) || props.d;
  return a ?? b;
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
  let t6;
  if (c_4 || c_5) {
    t6 = a ?? b;
    $[4] = a;
    $[5] = b;
    $[6] = t6;
  } else {
    t6 = $[6];
  }
  return t6;
}

```
      