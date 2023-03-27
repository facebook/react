
## Input

```javascript
function Component(props) {
  const { x: { y } = { y: "default" } } = props.y;
  return y;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const { x: t0 } = props.y;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = t0 === undefined ? { y: "default" } : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const { y } = t1;
  return y;
}

```
      