
## Input

```javascript
function foo(props) {
  let x, y;
  ({ x, y } = { x: props.a, y: props.b });
  x = props.c;
  return x + y;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let t0;
  if (c_0 || c_1) {
    t0 = { x: props.a, y: props.b };
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  let { x, y } = t0;
  x = props.c;
  return x + y;
}

```
      