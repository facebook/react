
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
  if (c_0 || c_1) {
    x = [];
    const y = undefined;
    let y$0 = y;
    bb1: switch (props.p0) {
      case 1: {
        break bb1;
      }
      case true: {
        x.push(props.p2);
        let y$1;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          y$1 = [];
          $[3] = y$1;
        } else {
          y$1 = $[3];
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
  } else {
    x = $[2];
  }
  const c_4 = $[4] !== x;
  let child;
  if (c_4) {
    child = <Component data={x}></Component>;
    $[4] = x;
    $[5] = child;
  } else {
    child = $[5];
  }
  y$0.push(props.p4);
  const c_6 = $[6] !== y$0;
  const c_7 = $[7] !== child;
  let t8;
  if (c_6 || c_7) {
    t8 = <Component data={y$0}>{child}</Component>;
    $[6] = y$0;
    $[7] = child;
    $[8] = t8;
  } else {
    t8 = $[8];
  }
  return t8;
}

```
      