
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  if (props.p1) {
    x = [];
  }

  let _ = <Component x={x} />;
  y.push(props.p2);

  return <Component x={x} y={y} />;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== props.p0;
  let x;
  if (c_0) {
    x = [];
    x.push(props.p0);
    $[0] = props.p0;
    $[1] = x;
  } else {
    x = $[1];
  }
  const y = x;
  if (props.p1) {
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = [];
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    x = t0;
  }

  y.push(props.p2);
  return <Component x={x} y={y}></Component>;
}

```
      