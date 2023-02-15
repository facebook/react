
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  switch (props.p0) {
    case true: {
      x.push(props.p2);
      x.push(props.p3);
      y = [];
    }
    case false: {
      y = x;
      break;
    }
  }
  const child = <Component data={x} />;
  y.push(props.p4);
  return <Component data={y}>{child}</Component>;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p2;
  const c_2 = $[2] !== props.p3;
  let x;
  let y;
  if (c_0 || c_1 || c_2) {
    x = [];
    y = undefined;
    switch (props.p0) {
      case true: {
        x.push(props.p2);
        x.push(props.p3);
      }
      case false: {
        y = x;
      }
    }
    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = props.p3;
    $[3] = x;
    $[4] = y;
  } else {
    x = $[3];
    y = $[4];
  }
  const c_5 = $[5] !== x;
  let child;
  if (c_5) {
    child = <Component data={x}></Component>;
    $[5] = x;
    $[6] = child;
  } else {
    child = $[6];
  }
  y.push(props.p4);
  const c_7 = $[7] !== y;
  const c_8 = $[8] !== child;
  let t0;
  if (c_7 || c_8) {
    t0 = <Component data={y}>{child}</Component>;
    $[7] = y;
    $[8] = child;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  return t0;
}

```
      