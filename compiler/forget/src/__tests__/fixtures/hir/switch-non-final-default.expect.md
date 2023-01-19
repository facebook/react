
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
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p2;
  let x;
  let y$0;
  if (c_0 || c_1) {
    x = [];
    const y = undefined;
    y$0 = y;
    bb1: switch (props.p0) {
      case 1: {
        break bb1;
      }
      case true: {
        x.push(props.p2);
        let y$1;
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
          y$1 = [];
          $[4] = y$1;
        } else {
          y$1 = $[4];
        }
        y$0 = y$1;
        break bb1;
      }
      default: {
        break bb1;
      }
      case false: {
        const y$2 = x;
        y$0 = y$2;
      }
    }
    $[0] = props.p0;
    $[1] = props.p2;
    $[2] = x;
    $[3] = y$0;
  } else {
    x = $[2];
    y$0 = $[3];
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
  const c_7 = $[7] !== y$0;
  const c_8 = $[8] !== child;
  let t9;
  if (c_7 || c_8) {
    t9 = <Component data={y$0}>{child}</Component>;
    $[7] = y$0;
    $[8] = child;
    $[9] = t9;
  } else {
    t9 = $[9];
  }
  return t9;
}

```
      