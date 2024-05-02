
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
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(8);
  let x;
  let y;
  if ($[0] !== props) {
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
  let t0;
  if ($[3] !== x) {
    t0 = <Component data={x} />;
    $[3] = x;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  const child = t0;
  y.push(props.p4);
  let t1;
  if ($[5] !== y || $[6] !== child) {
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
      