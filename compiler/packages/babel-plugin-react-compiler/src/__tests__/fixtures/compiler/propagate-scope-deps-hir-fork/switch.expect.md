
## Input

```javascript
// @enablePropagateDepsInHIR
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
import { c as _c } from "react/compiler-runtime"; // @enablePropagateDepsInHIR
function Component(props) {
  const $ = _c(8);
  let y;
  let t0;
  if ($[0] !== props.p0 || $[1] !== props.p2 || $[2] !== props.p3) {
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
    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = props.p3;
    $[3] = y;
    $[4] = t0;
  } else {
    y = $[3];
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
      
### Eval output
(kind: exception) Fixture not implemented