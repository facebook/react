
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  console.log(_);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props.bar;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    $[0] = props.bar;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== props;
  let t0;
  if (c_2) {
    t0 = props.cond
      ? ((x = []), x.push(props.foo))
      : ((x = []), x.push(props.bar));
    $[2] = props;
    $[3] = t0;
    $[4] = x;
  } else {
    t0 = $[3];
    x = $[4];
  }
  const _ = t0;
  console.log(_);
  return x;
}

```
      