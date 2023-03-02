
## Input

```javascript
function Component(props) {
  let x = [0, 1, 2, 3];
  do {
    if (x === 0) {
      break;
    }
    mutate(x);
  } while (props.cond);
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.cond;
  let x;
  if (c_0) {
    x = [0, 1, 2, 3];
    do {
      if (x === 0) {
        break;
      }

      mutate(x);
    } while (props.cond);
    $[0] = props.cond;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      