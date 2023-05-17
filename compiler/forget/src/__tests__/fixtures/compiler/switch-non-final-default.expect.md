
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  switch (props.p0) {
    case 1: {
      break;
    }
    case true: {
      x.push(props.p2);
      y = [];
    }
    default: {
      break;
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(9);
  const c_0 = $[0] !== props;
  let x;
  let y;
  if (c_0) {
    x = [];
    bb1: switch (props.p0) {
      case 1: {
        break bb1;
      }
      case true: {
        x.push(props.p2);
        let t0;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          t0 = [];
          $[3] = t0;
        } else {
          t0 = $[3];
        }
        y = t0;
      }
      default: {
        break bb1;
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
  const c_4 = $[4] !== x;
  let t1;
  if (c_4) {
    t1 = <Component data={x} />;
    $[4] = x;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const child = t1;
  y.push(props.p4);
  const c_6 = $[6] !== y;
  const c_7 = $[7] !== child;
  let t2;
  if (c_6 || c_7) {
    t2 = <Component data={y}>{child}</Component>;
    $[6] = y;
    $[7] = child;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}

```
      