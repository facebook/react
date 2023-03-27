
## Input

```javascript
function Component(props) {
  const [[x] = [foo()]] = props.y;
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const [t0] = props.y;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = t0 === undefined ? [foo()] : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [x] = t1;
  return x;
}

```
      