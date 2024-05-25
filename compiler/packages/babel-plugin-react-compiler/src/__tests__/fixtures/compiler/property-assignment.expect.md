
## Input

```javascript
function Component(props) {
  const x = {};
  const y = [];
  x.y = y;
  const child = <Component data={y} />;
  x.y.push(props.p0);
  return <Component data={x}>{child}</Component>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let x;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    const y = [];
    x.y = y;
    t0 = <Component data={y} />;
    $[0] = x;
    $[1] = t0;
  } else {
    x = $[0];
    t0 = $[1];
  }
  const child = t0;
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Component data={x}>{child}</Component>;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  x.y.push(props.p0);
  return t1;
}

```
      