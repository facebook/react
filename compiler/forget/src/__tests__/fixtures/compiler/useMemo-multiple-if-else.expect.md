
## Input

```javascript
// @inlineUseMemo
function Component(props) {
  const x = useMemo(() => {
    let y = [];
    if (props.cond) {
      y.push(props.a);
    }
    if (props.cond2) {
      return y;
    }
    y.push(props.b);
    return y;
  });
  return x;
}

```

## Code

```javascript
// @inlineUseMemo
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    const y = [];
    if (props.cond) {
      y.push(props.a);
    }
    if (props.cond2) {
      t0 = y;
    } else {
      y.push(props.b);
      t0 = y;
    }
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

```
      