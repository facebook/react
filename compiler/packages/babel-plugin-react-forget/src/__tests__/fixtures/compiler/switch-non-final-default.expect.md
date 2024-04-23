
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
  let x;
  let y;
  if ($[0] !== props) {
    x = [];
    bb0: switch (props.p0) {
      case 1: {
        break bb0;
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
        break bb0;
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
  if ($[4] !== x) {
    t0 = <Component data={x} />;
    $[4] = x;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  const child = t0;
  y.push(props.p4);
  let t1;
  if ($[6] !== y || $[7] !== child) {
    t1 = <Component data={y}>{child}</Component>;
    $[6] = y;
    $[7] = child;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  return t1;
}

```
      