
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
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(8);
  const c_0 = $[0] !== props;
  let x;
  let y;
  if (c_0) {
    x = [];
    switch (props.p0) {
      case true: {
        x.push(props.p2);
        x.push(props.p3);
      }
      case false: {
        y = x;
      }
    }
    $[0] = props;
    $[1] = x;
    $[2] = y;
  } else {
    x = $[1];
    y = $[2];
  }
  const c_3 = $[3] !== x;
  let t0;
  if (c_3) {
    t0 = <Component data={x} />;
    $[3] = x;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  const child = t0;
  y.push(props.p4);
  const c_5 = $[5] !== y;
  const c_6 = $[6] !== child;
  let t1;
  if (c_5 || c_6) {
    t1 = <Component data={y}>{child}</Component>;
    $[5] = y;
    $[6] = child;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
}

```
      