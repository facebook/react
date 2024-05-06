
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  x = [];
  let _ = <Component x={x} />;

  y.push(props.p1);

  return <Component x={x} y={y} />;
}

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(8);
  let x;
  let y;
  if ($[0] !== props.p0 || $[1] !== props.p1) {
    x = [];
    x.push(props.p0);
    y = x;
    let t0;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = [];
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    x = t0;

    y.push(props.p1);
    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = x;
    $[3] = y;
  } else {
    x = $[2];
    y = $[3];
  }
  let t0;
  if ($[5] !== x || $[6] !== y) {
    t0 = <Component x={x} y={y} />;
    $[5] = x;
    $[6] = y;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      