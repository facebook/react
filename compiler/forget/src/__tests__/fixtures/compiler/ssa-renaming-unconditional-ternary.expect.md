
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  console.log(_);
  return x;
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.bar;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    $[0] = props.bar;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== props;
  if (c_2) {
    const _ = props.cond
      ? ((x = []), x.push(props.foo))
      : ((x = []), x.push(props.bar));
    console.log(_);
    $[2] = props;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      