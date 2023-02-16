
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
function Component(props) {
  const $ = React.unstable_useMemoCache(10);
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p2;
  let x;
  let y;
  if (c_0 || c_1) {
    x = [];
    y = undefined;
    bb1: switch (props.p0) {
      case 1: {
        break bb1;
      }
      case true: {
        x.push(props.p2);
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
          y = [];
          $[4] = y;
        } else {
          y = $[4];
        }
        break bb1;
      }
      default: {
        break bb1;
      }
      case false: {
        y = x;
      }
    }
    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = x;
    $[3] = y;
  } else {
    x = $[2];
    y = $[3];
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
      