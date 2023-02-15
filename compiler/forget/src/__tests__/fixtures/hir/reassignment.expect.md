
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
  let x;
  let y;
  if (c_0 || c_1) {
    x = [];
    x.push(props.p0);
    y = x;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      x = [];
      $[4] = x;
    } else {
      x = $[4];
    }

    y.push(props.p1);
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = x;
    $[3] = y;
  } else {
    x = $[2];
    y = $[3];
  }
  const c_5 = $[5] !== x;
  const c_6 = $[6] !== y;
  let t0;
  if (c_5 || c_6) {
    t0 = <Component x={x} y={y}></Component>;
    $[5] = x;
    $[6] = y;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      