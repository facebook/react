
## Input

```javascript
function Component(props) {
  let x;
  if (props.cond) {
    [[x] = ["default"]] = props.y;
  } else {
    x = props.fallback;
  }
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let x = undefined;
  if (props.cond) {
    const [t0] = props.y;
    const c_0 = $[0] !== t0;
    let t1;
    if (c_0) {
      t1 = t0 === undefined ? ["default"] : t0;
      $[0] = t0;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    [x] = t1;
  } else {
    x = props.fallback;
  }
  return x;
}

```
      