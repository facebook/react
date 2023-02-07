
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  x = [];
  let _ = <Component x={x} />;

  y.push(props.p1);

  return <Component x={x} y={y} />;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  let y;
  if (c_0 || c_1) {
    const x = [];
    x.push(props.p0);
    y = x;
    let x$0;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      x$0 = [];
      $[3] = x$0;
    } else {
      x$0 = $[3];
    }

    y.push(props.p1);
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = y;
  } else {
    y = $[2];
  }
  const c_4 = $[4] !== y;
  let t0;
  if (c_4) {
    t0 = <Component x={x$0} y={y}></Component>;
    $[4] = y;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

```
      