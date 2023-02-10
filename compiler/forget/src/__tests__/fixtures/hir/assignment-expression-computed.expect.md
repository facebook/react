
## Input

```javascript
function Component(props) {
  const x = [props.x];
  const index = 0;
  x[index] *= 2;
  x["0"] += 3;
  return x;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.x;
  let x;
  if (c_0) {
    x = [props.x];
    const index = 0;
    x[index] = x[index] * 2;
    const t0 = "0";
    x[t0] = x[t0] + 3;
    $[0] = props.x;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      