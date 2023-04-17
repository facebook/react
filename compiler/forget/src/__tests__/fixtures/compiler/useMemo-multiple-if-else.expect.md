
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
  let t25;
  if (c_0) {
    const y = [];
    if (props.cond) {
      y.push(props.a);
    }
    t25 = undefined;
    if (props.cond2) {
      t25 = y;
    } else {
      y.push(props.b);
      t25 = y;
    }
    $[0] = props;
    $[1] = t25;
  } else {
    t25 = $[1];
  }
  const x = t25;
  return x;
}

```
      