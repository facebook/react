
## Input

```javascript
function foo(props) {
  let x = 0;
  let y = 0;
  while (y < props.max) {
    x++;
    y++;
  }
  return y;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.max;
  let y;
  if (c_0) {
    y = 0;
    while (y < props.max) {
      y = y + 1;
    }
    $[0] = props.max;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      