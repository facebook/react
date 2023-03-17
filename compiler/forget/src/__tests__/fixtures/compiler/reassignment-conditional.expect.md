
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
  const $ = React.unstable_useMemoCache(6);
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
  const c_3 = $[3] !== x;
  const c_4 = $[4] !== y;
  let t1;
  if (c_3 || c_4) {
    t1 = <Component x={x} y={y} />;
    $[3] = x;
    $[4] = y;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

```
      