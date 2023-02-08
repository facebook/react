
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
  const $ = React.unstable_useMemoCache();
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
  let x$0 = x;
  if (props.p1) {
    let x$1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      x$1 = [];
      $[2] = x$1;
    } else {
      x$1 = $[2];
    }
    x$0 = x$1;
  }

  y.push(props.p2);
  const c_3 = $[3] !== y;
  let t0;
  if (c_3) {
    t0 = <Component x={x$0} y={y}></Component>;
    $[3] = y;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```
      