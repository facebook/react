
## Input

```javascript
function Component(props) {
  const x = {};
  const y = [];
  x.y = y;
  const child = <Component data={y} />;
  x.y.push(props.p0);
  return <Component data={x}>{child}</Component>;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    let y;

    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      y = [];
      $[1] = y;
    } else {
      y = $[1];
    }

    x.y = y;
    $[0] = x;
  } else {
    x = $[0];
  }

  const c_2 = $[2] !== y;
  let child;

  if (c_2) {
    child = <Component data={y}></Component>;
    $[2] = y;
    $[3] = child;
  } else {
    child = $[3];
  }

  x.y.push(props.p0);
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== child;
  let t6;

  if (c_4 || c_5) {
    t6 = <Component data={x}>{child}</Component>;
    $[4] = x;
    $[5] = child;
    $[6] = t6;
  } else {
    t6 = $[6];
  }

  return t6;
}

```
      