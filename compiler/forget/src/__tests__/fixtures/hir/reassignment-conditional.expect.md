
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
  const c_2 = $[2] !== props.p1;
  let x$0;
  if (c_2) {
    x$0 = x;
    if (props.p1) {
      let x$1;
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        x$1 = [];
        $[4] = x$1;
      } else {
        x$1 = $[4];
      }
      x$0 = x$1;
    }
    $[2] = props.p1;
    $[3] = x$0;
  } else {
    x$0 = $[3];
  }

  y.push(props.p2);
  const c_5 = $[5] !== x$0;
  const c_6 = $[6] !== y;
  let t0;
  if (c_5 || c_6) {
    t0 = <Component x={x$0} y={y}></Component>;
    $[5] = x$0;
    $[6] = y;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      