
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(6);
  let y;
  let t0;
  if ($[0] !== props) {
    const x = [];
    switch (props.p0) {
      case true: {
        x.push(props.p2);
        x.push(props.p3);
      }
      case false: {
        y = x;
      }
    }

    t0 = <Component data={x} />;
    $[0] = props;
    $[1] = y;
    $[2] = t0;
  } else {
    y = $[1];
    t0 = $[2];
  }
  const child = t0;
  y.push(props.p4);
  let t1;
  if ($[3] !== y || $[4] !== child) {
    t1 = <Component data={y}>{child}</Component>;
    $[3] = y;
    $[4] = child;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

```
      