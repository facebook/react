
## Input

```javascript
function foo(props) {
  let x, y;
  ({ x, y } = { x: props.a, y: props.b });
  console.log(x); // prevent DCE from eliminating `x` altogether
  x = props.c;
  return x + y;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let x;
  let y;
  if (c_0 || c_1) {
    ({ x, y } = { x: props.a, y: props.b });
    console.log(x);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = x;
    $[3] = y;
  } else {
    x = $[2];
    y = $[3];
  }
  x = props.c;
  return x + y;
}

```
      