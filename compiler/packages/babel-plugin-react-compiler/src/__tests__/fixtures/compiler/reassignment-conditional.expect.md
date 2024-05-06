
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
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(9);
  let x;
  let y;
  if ($[0] !== props.p0 || $[1] !== props.p1 || $[2] !== props.p2) {
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
  let t0;
  if ($[6] !== x || $[7] !== y) {
    t0 = <Component x={x} y={y} />;
    $[6] = x;
    $[7] = y;
    $[8] = t0;
  } else {
    t0 = $[8];
  }
  return t0;
}

```
      