
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
  let y$0;
  if (c_0 || c_1 || c_2) {
    x = [];
    const y = undefined;
    y$0 = y;
    switch (props.p0) {
      case true: {
        x.push(props.p2);
        x.push(props.p3);
      }
      case false: {
        const y$1 = x;
        y$0 = y$1;
      }
    }
    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = props.p3;
    $[3] = x;
    $[4] = y$0;
  } else {
    x = $[3];
    y$0 = $[4];
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
  y$0.push(props.p4);
  const c_7 = $[7] !== child;
  let t0;
  if (c_7) {
    t0 = <Component data={y$0}>{child}</Component>;
    $[7] = child;
    $[8] = t0;
  } else {
    t0 = $[8];
  }
  return t0;
}

```
      