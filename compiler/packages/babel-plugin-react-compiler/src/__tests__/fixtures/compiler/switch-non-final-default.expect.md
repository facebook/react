
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(7);
  let t0;
  let y;
  if ($[0] !== props) {
    const x = [];
    bb0: switch (props.p0) {
      case 1: {
        break bb0;
      }
      case true: {
        x.push(props.p2);
        let t1;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          t1 = [];
          $[3] = t1;
        } else {
          t1 = $[3];
        }
        y = t1;
      }
      default: {
        break bb0;
      }
      case false: {
        y = x;
      }
    }

    t0 = <Component data={x} />;
    $[0] = props;
    $[1] = t0;
    $[2] = y;
  } else {
    t0 = $[1];
    y = $[2];
  }
  const child = t0;
  y.push(props.p4);
  let t1;
  if ($[4] !== child || $[5] !== y) {
    t1 = <Component data={y}>{child}</Component>;
    $[4] = child;
    $[5] = y;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

```
      