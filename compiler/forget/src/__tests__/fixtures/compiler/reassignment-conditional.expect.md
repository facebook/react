
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  if (props.p1) {
    x = [];
  }

  y.push(props.p2);

  return <Component x={x} y={y} />;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(9);
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let x;
  let y;
  if (c_0 || c_1 || c_2) {
    x = [];
    x.push(props.p0);
    y = x;
    if (props.p1) {
      let t0;
      if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = [];
        $[5] = t0;
      } else {
        t0 = $[5];
      }
      x = t0;
    }

    y.push(props.p2);
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = props.p2;
    $[3] = x;
    $[4] = y;
  } else {
    x = $[3];
    y = $[4];
  }
  const c_6 = $[6] !== x;
  const c_7 = $[7] !== y;
  let t1;
  if (c_6 || c_7) {
    t1 = <Component x={x} y={y} />;
    $[6] = x;
    $[7] = y;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  return t1;
}

```
      