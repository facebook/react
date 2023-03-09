
## Input

```javascript
function foo(props) {
  let y = 0;
  for (
    let x = 0;
    x > props.min && x < props.max;
    x += props.cond ? props.increment : 2
  ) {
    x *= 2;
    y += x;
  }
  return y;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let y;
  if (c_0) {
    y = 0;
    for (
      let x = 0;
      x > props.min && x < props.max;
      x = x + (props.cond ? props.increment : 2), x
    ) {
      x = x * 2;
      y = y + x;
    }
    $[0] = props;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      