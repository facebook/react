
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
import { c as useMemoCache } from "react/compiler-runtime";
function Component(props) {
  const $ = useMemoCache(6);
  let x;
  let child;
  if ($[0] !== props.p0) {
    x = {};
    const y = [];
    x.y = y;
    child = <Component data={y} />;
    x.y.push(props.p0);
    $[0] = props.p0;
    $[1] = x;
    $[2] = child;
  } else {
    x = $[1];
    child = $[2];
  }
  let t0;
  if ($[3] !== x || $[4] !== child) {
    t0 = <Component data={x}>{child}</Component>;
    $[3] = x;
    $[4] = child;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

```
      